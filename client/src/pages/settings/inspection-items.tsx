
import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';

export default function InspectionItems() {
  const { user } = useAuth();
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [inspectionData, setInspectionData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [files, setFiles] = useState<{ name: string; size: number; modified: string }[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('仕業点検マスタ.csv');
  const [isEditing, setIsEditing] = useState(false);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editData, setEditData] = useState<any>({});
  const { toast } = useToast();

  // CSVファイル一覧を取得
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await fetch('/api/inspection-files');
        if (!response.ok) throw new Error('ファイル一覧の取得に失敗しました');
        const data = await response.json();
        setFiles(data.files || []);
      } catch (error) {
        console.error('ファイル一覧取得エラー:', error);
        toast({
          title: 'エラー',
          description: 'ファイル一覧の取得に失敗しました',
          variant: 'destructive',
        });
      }
    };

    fetchFiles();
  }, [toast]);

  // 点検項目データの取得
  useEffect(() => {
    const fetchInspectionData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/inspection-items?file=${selectedFile}`);
        if (!response.ok) throw new Error('データの取得に失敗しました');
        
        const text = await response.text();
        // CSVをパース
        const rows = text.split('\n');
        const headers = rows[0].split(',');
        
        const data = rows.slice(1).filter(row => row.trim()).map(row => {
          const values = row.split(',');
          const item: Record<string, string> = {};
          headers.forEach((header, index) => {
            item[header] = values[index] || '';
          });
          return item;
        });

        console.log('仕業点検：データ読み込み成功', data.length, '件');
        console.log('データサンプル:', data.slice(0, 3));

        setInspectionData(data);

        // メーカーと機種の一覧を抽出
        const makerKey = '製造メーカー';
        const modelKey = '機種';
        
        console.log('CSVデータの最初の行:', rows[0]);
        console.log('データのキー:', headers);
        console.log('使用するメーカーキー:', makerKey);
        console.log('使用する機種キー:', modelKey);
        
        const uniqueManufacturers = Array.from(new Set(data.map(item => item[makerKey]).filter(Boolean)));
        const uniqueModels = Array.from(new Set(data.map(item => item[modelKey]).filter(Boolean)));
        
        console.log('メーカーリスト:', uniqueManufacturers);
        console.log('機種リスト:', uniqueModels);
        
        setManufacturers(uniqueManufacturers);
        setModels(uniqueModels);

        // 初期表示
        setFilteredData(data);
      } catch (error) {
        console.error('データ取得エラー:', error);
        toast({
          title: 'エラー',
          description: 'データの取得に失敗しました',
          variant: 'destructive',
        });
        setInspectionData([]);
        setFilteredData([]);
      } finally {
        setLoading(false);
      }
    };

    if (selectedFile) {
      fetchInspectionData();
    }
  }, [selectedFile, toast]);

  // フィルター適用
  useEffect(() => {
    let filtered = [...inspectionData];
    
    if (selectedManufacturer) {
      filtered = filtered.filter(item => item['製造メーカー'] === selectedManufacturer);
    }
    
    if (selectedModel) {
      filtered = filtered.filter(item => item['機種'] === selectedModel);
    }
    
    setFilteredData(filtered);
  }, [inspectionData, selectedManufacturer, selectedModel]);

  // 編集モードの切替
  const handleEdit = (index: number) => {
    setIsEditing(true);
    setEditingRow(index);
    setEditData({ ...filteredData[index] });
  };

  // 編集キャンセル
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingRow(null);
    setEditData({});
  };

  // 編集内容の保存
  const handleSaveEdit = () => {
    if (editingRow !== null) {
      const newData = [...filteredData];
      newData[editingRow] = { ...editData };
      setFilteredData(newData);
      
      const newFullData = [...inspectionData];
      const fullDataIndex = inspectionData.findIndex(item => 
        item['製造メーカー'] === filteredData[editingRow]['製造メーカー'] &&
        item['機種'] === filteredData[editingRow]['機種'] &&
        item['確認箇所'] === filteredData[editingRow]['確認箇所']
      );
      
      if (fullDataIndex !== -1) {
        newFullData[fullDataIndex] = { ...editData };
        setInspectionData(newFullData);
      }
      
      setIsEditing(false);
      setEditingRow(null);
      setEditData({});
    }
  };

  // 入力値の変更ハンドラ
  const handleInputChange = (key: string, value: string) => {
    setEditData(prev => ({ ...prev, [key]: value }));
  };

  // CSVデータの保存
  const handleSaveAll = async () => {
    try {
      // ヘッダー行を取得
      const headers = Object.keys(inspectionData[0]);
      
      // CSVデータを整形
      const csvRows = [headers.join(',')];
      inspectionData.forEach(row => {
        csvRows.push(headers.map(header => row[header] || '').join(','));
      });
      
      const csvContent = csvRows.join('\n');
      
      const response = await fetch('/api/save-inspection-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: csvContent,
          fileName: `仕業点検_編集済_${new Date().toISOString().slice(0, 10)}.csv`,
        }),
      });
      
      if (!response.ok) throw new Error('データの保存に失敗しました');
      
      const result = await response.json();
      toast({
        title: '成功',
        description: `データを保存しました: ${result.fileName}`,
      });
      
      // ファイル一覧を更新
      const filesResponse = await fetch('/api/inspection-files');
      if (filesResponse.ok) {
        const filesData = await filesResponse.json();
        setFiles(filesData.files || []);
      }
    } catch (error) {
      console.error('データ保存エラー:', error);
      toast({
        title: 'エラー',
        description: '点検項目データの保存に失敗しました',
        variant: 'destructive',
      });
    }
  };

  // ファイルアップロード
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/upload-inspection-items', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('ファイルのアップロードに失敗しました');
      
      const result = await response.json();
      toast({
        title: '成功',
        description: `ファイルをアップロードしました: ${result.fileName}`,
      });
      
      // ファイル一覧を更新
      const filesResponse = await fetch('/api/inspection-files');
      if (filesResponse.ok) {
        const filesData = await filesResponse.json();
        setFiles(filesData.files || []);
        setSelectedFile(result.fileName);
      }
    } catch (error) {
      console.error('ファイルアップロードエラー:', error);
      toast({
        title: 'エラー',
        description: 'ファイルのアップロードに失敗しました',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar onExpandChange={setIsMenuExpanded} />
      <div className={`flex-1 ${isMenuExpanded ? 'ml-64' : 'ml-16'} transition-all duration-300 overflow-auto`}>
        <main className="p-6">
          <h1 className="text-2xl font-bold mb-6">点検項目設定</h1>
          
          <Tabs defaultValue="view" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="view">点検項目表示</TabsTrigger>
              <TabsTrigger value="upload">CSVファイル管理</TabsTrigger>
            </TabsList>
            
            <TabsContent value="view">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">フィルター</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4">
                    <div className="w-full md:w-64">
                      <label className="block text-sm font-medium mb-1">ファイル</label>
                      <Select value={selectedFile} onValueChange={setSelectedFile}>
                        <SelectTrigger>
                          <SelectValue placeholder="ファイルを選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {files.map(file => (
                            <SelectItem key={file.name} value={file.name}>
                              {file.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="w-full md:w-64">
                      <label className="block text-sm font-medium mb-1">メーカー</label>
                      <Select value={selectedManufacturer} onValueChange={setSelectedManufacturer}>
                        <SelectTrigger>
                          <SelectValue placeholder="メーカーを選択" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">すべて</SelectItem>
                          {manufacturers.map(manufacturer => (
                            <SelectItem key={manufacturer} value={manufacturer}>
                              {manufacturer}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="w-full md:w-64">
                      <label className="block text-sm font-medium mb-1">機種</label>
                      <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger>
                          <SelectValue placeholder="機種を選択" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">すべて</SelectItem>
                          {models.map(model => (
                            <SelectItem key={model} value={model}>
                              {model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">点検項目一覧</CardTitle>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveAll} variant="primary">
                      レイアウト保存
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => window.history.back()}
                    >
                      閉じる
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center p-4">データを読み込み中...</div>
                  ) : filteredData.length === 0 ? (
                    <div className="text-center p-4">データがありません</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>編集</TableHead>
                            <TableHead>製造メーカー</TableHead>
                            <TableHead>機種</TableHead>
                            <TableHead>エンジン型式</TableHead>
                            <TableHead>部位</TableHead>
                            <TableHead>装置</TableHead>
                            <TableHead>確認箇所</TableHead>
                            <TableHead>判断基準</TableHead>
                            <TableHead>確認要領</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredData.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                {isEditing && editingRow === index ? (
                                  <div className="flex gap-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={handleSaveEdit}
                                    >
                                      保存
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={handleCancelEdit}
                                    >
                                      キャンセル
                                    </Button>
                                  </div>
                                ) : (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleEdit(index)}
                                  >
                                    編集
                                  </Button>
                                )}
                              </TableCell>
                              <TableCell>
                                {isEditing && editingRow === index ? (
                                  <Input 
                                    value={editData['製造メーカー'] || ''} 
                                    onChange={(e) => handleInputChange('製造メーカー', e.target.value)}
                                    className="w-32"
                                  />
                                ) : (
                                  item['製造メーカー']
                                )}
                              </TableCell>
                              <TableCell>
                                {isEditing && editingRow === index ? (
                                  <Input 
                                    value={editData['機種'] || ''} 
                                    onChange={(e) => handleInputChange('機種', e.target.value)}
                                    className="w-32"
                                  />
                                ) : (
                                  item['機種']
                                )}
                              </TableCell>
                              <TableCell>
                                {isEditing && editingRow === index ? (
                                  <Input 
                                    value={editData['エンジン型式'] || ''} 
                                    onChange={(e) => handleInputChange('エンジン型式', e.target.value)}
                                    className="w-32"
                                  />
                                ) : (
                                  item['エンジン型式']
                                )}
                              </TableCell>
                              <TableCell>
                                {isEditing && editingRow === index ? (
                                  <Input 
                                    value={editData['部位'] || ''} 
                                    onChange={(e) => handleInputChange('部位', e.target.value)}
                                    className="w-32"
                                  />
                                ) : (
                                  item['部位']
                                )}
                              </TableCell>
                              <TableCell>
                                {isEditing && editingRow === index ? (
                                  <Input 
                                    value={editData['装置'] || ''} 
                                    onChange={(e) => handleInputChange('装置', e.target.value)}
                                    className="w-32"
                                  />
                                ) : (
                                  item['装置']
                                )}
                              </TableCell>
                              <TableCell>
                                {isEditing && editingRow === index ? (
                                  <Input 
                                    value={editData['確認箇所'] || ''} 
                                    onChange={(e) => handleInputChange('確認箇所', e.target.value)}
                                    className="w-32"
                                  />
                                ) : (
                                  item['確認箇所']
                                )}
                              </TableCell>
                              <TableCell>
                                {isEditing && editingRow === index ? (
                                  <Input 
                                    value={editData['判断基準'] || ''} 
                                    onChange={(e) => handleInputChange('判断基準', e.target.value)}
                                    className="w-full"
                                  />
                                ) : (
                                  item['判断基準']
                                )}
                              </TableCell>
                              <TableCell>
                                {isEditing && editingRow === index ? (
                                  <Input 
                                    value={editData['確認要領'] || ''} 
                                    onChange={(e) => handleInputChange('確認要領', e.target.value)}
                                    className="w-full"
                                  />
                                ) : (
                                  item['確認要領']
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="upload">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">CSVファイルのアップロード</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">ファイルを選択</label>
                      <Input 
                        type="file" 
                        accept=".csv" 
                        onChange={handleFileUpload}
                      />
                      <p className="text-sm text-muted-foreground">CSVファイル形式のみ対応しています</p>
                    </div>
                    
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-2">利用可能なCSVファイル</h3>
                      {files.length === 0 ? (
                        <p>アップロード済みのファイルはありません</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>ファイル名</TableHead>
                                <TableHead>サイズ</TableHead>
                                <TableHead>更新日時</TableHead>
                                <TableHead>操作</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {files.map((file) => (
                                <TableRow key={file.name}>
                                  <TableCell>{file.name}</TableCell>
                                  <TableCell>{Math.round(file.size / 1024)} KB</TableCell>
                                  <TableCell>{new Date(file.modified).toLocaleString()}</TableCell>
                                  <TableCell>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setSelectedFile(file.name)}
                                    >
                                      表示
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
