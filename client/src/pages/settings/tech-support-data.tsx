
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui';
import { FileUp, File, Image, FileText, Download, Loader2 } from 'lucide-react';

export default function TechSupportData() {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [fileData, setFileData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('upload');

  // 処理済みファイル一覧の取得
  const fetchFiles = async () => {
    try {
      const response = await fetch('/api/tech-support/files');
      const data = await response.json();
      if (data.files) {
        setFiles(data.files);
      }
    } catch (error) {
      console.error('ファイル一覧取得エラー:', error);
      toast({
        title: 'エラー',
        description: 'ファイル一覧の取得に失敗しました',
        variant: 'destructive',
      });
    }
  };

  // ファイルデータの取得
  const fetchFileData = async (fileName: string) => {
    try {
      const response = await fetch(`/api/tech-support/data/${fileName}`);
      if (!response.ok) {
        throw new Error('データの取得に失敗しました');
      }
      const data = await response.json();
      setFileData(data);
    } catch (error) {
      console.error('ファイルデータ取得エラー:', error);
      toast({
        title: 'エラー',
        description: 'ファイルデータの取得に失敗しました',
        variant: 'destructive',
      });
    }
  };

  // 初回レンダリング時にファイル一覧を取得
  useEffect(() => {
    fetchFiles();
  }, []);

  // ファイルアップロードハンドラ
  const handleFileUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const file = formData.get('file') as File;

    if (!file) {
      toast({
        title: 'ファイルが選択されていません',
        description: 'アップロードするファイルを選択してください',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/tech-support/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'アップロードに失敗しました');
      }

      const result = await response.json();
      toast({
        title: 'アップロード成功',
        description: `${file.name}を処理しました。テキストデータと${result.imageCount}枚の画像を抽出しました。`,
      });

      // ファイル一覧を更新
      fetchFiles();
      setActiveTab('files');
    } catch (error) {
      console.error('アップロードエラー:', error);
      toast({
        title: 'アップロードエラー',
        description: error.message || 'ファイルのアップロードに失敗しました',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  // ファイル選択ハンドラ
  const handleFileSelect = (file: any) => {
    setSelectedFile(file);
    fetchFileData(file.name);
  };

  // 日付フォーマット関数
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // PowerPointスライドのレンダリング
  const renderSlides = () => {
    if (!fileData || !fileData.slides) return null;

    return (
      <div className="space-y-4">
        {fileData.slides.map((slide: any, index: number) => (
          <Card key={index} className="p-4">
            <h3 className="text-lg font-semibold mb-2">スライド {slide.slideNumber}</h3>
            {slide.text && <p className="mb-4">{slide.text}</p>}
            {slide.images && slide.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {slide.images.map((image: any, imgIndex: number) => (
                  <div key={imgIndex} className="border rounded overflow-hidden">
                    <img
                      src={`/api/tech-support/images/${image.fileName}`}
                      alt={`スライド${slide.slideNumber}の画像${imgIndex + 1}`}
                      className="w-full h-auto"
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    );
  };

  // Excelシートのレンダリング
  const renderSheets = () => {
    if (!fileData || !fileData.sheets) return null;

    return (
      <div className="space-y-4">
        {fileData.sheets.map((sheet: any, index: number) => (
          <Card key={index} className="p-4">
            <h3 className="text-lg font-semibold mb-2">シート: {sheet.name}</h3>
            {sheet.rows && sheet.rows.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableBody>
                    {sheet.rows.map((row: any, rowIndex: number) => (
                      <TableRow key={rowIndex}>
                        {Object.keys(row).map((col) => (
                          <TableCell key={col}>{row[col]}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p>このシートにはデータがありません。</p>
            )}
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">技術支援データ処理</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="upload">ファイルアップロード</TabsTrigger>
          <TabsTrigger value="files">処理済みファイル</TabsTrigger>
          {selectedFile && (
            <TabsTrigger value="view">ファイル閲覧</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>ファイルアップロード</CardTitle>
              <CardDescription>
                PowerPointまたはExcelファイルをアップロードして、テキストと画像を抽出します。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFileUpload} className="space-y-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="file">ファイルを選択</Label>
                  <Input
                    id="file"
                    name="file"
                    type="file"
                    accept=".pptx,.xlsx,.xls"
                    className="cursor-pointer"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    対応形式: .pptx, .xlsx, .xls
                  </p>
                </div>
                <Button type="submit" className="mt-4" disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      アップロード中...
                    </>
                  ) : (
                    <>
                      <FileUp className="mr-2 h-4 w-4" />
                      アップロード
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files">
          <Card>
            <CardHeader>
              <CardTitle>処理済みファイル</CardTitle>
              <CardDescription>
                処理済みファイルの一覧です。閲覧したいファイルを選択してください。
              </CardDescription>
            </CardHeader>
            <CardContent>
              {files.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ファイル名</TableHead>
                      <TableHead>更新日時</TableHead>
                      <TableHead>アクション</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {files.map((file) => (
                      <TableRow
                        key={file.name}
                        className={selectedFile?.name === file.name ? 'bg-muted' : ''}
                      >
                        <TableCell className="font-medium">{file.name}</TableCell>
                        <TableCell>{formatDate(file.modified)}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              handleFileSelect(file);
                              setActiveTab('view');
                            }}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            閲覧
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-4">
                  <p>処理済みファイルがありません。</p>
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => setActiveTab('upload')}
                  >
                    <FileUp className="mr-2 h-4 w-4" />
                    ファイルをアップロード
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="view">
          {selectedFile && fileData && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>{fileData.title || selectedFile.name}</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/api/tech-support/data/${selectedFile.name}`, '_blank')}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      JSONダウンロード
                    </Button>
                  </div>
                  <CardDescription>
                    {fileData.metadata?.extractedAt && (
                      <span>
                        抽出日時: {formatDate(fileData.metadata.extractedAt)}
                      </span>
                    )}
                    {fileData.metadata?.originalFileName && (
                      <div>
                        元ファイル: {fileData.metadata.originalFileName}
                      </div>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {fileData.slides && renderSlides()}
                  {fileData.sheets && renderSheets()}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
