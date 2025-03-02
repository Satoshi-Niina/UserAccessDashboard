
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { 
  Card, CardContent, CardHeader, CardTitle,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui';
import { Plus, Edit, Trash2, Move, Upload, Save, X } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

// CSVから読み込んだデータの形式
interface InspectionItem {
  id: string;
  manufacturer: string;
  modelType: string;
  engineType: string;
  part: string;
  device: string;
  procedure: string;
  checkPoint: string;
  judgmentCriteria: string;
  checkMethod: string;
  measurement: string;
  graphicRecord: string;
  order: number;
}

// 初期カラム定義
const initialColumns = [
  { id: 'manufacturer', name: '製造メーカー', required: true },
  { id: 'modelType', name: '機種', required: true },
  { id: 'engineType', name: 'エンジン型式', required: false },
  { id: 'part', name: '部位', required: true },
  { id: 'device', name: '装置', required: true },
  { id: 'procedure', name: '手順', required: false },
  { id: 'checkPoint', name: '確認箇所', required: true },
  { id: 'judgmentCriteria', name: '判断基準', required: true },
  { id: 'checkMethod', name: '確認要領', required: false },
  { id: 'measurement', name: '測定等記録', required: false },
  { id: 'graphicRecord', name: '図形記録', required: false },
];

// CSVの項目を処理して表示用のアイテムに変換する関数
const parseCSVData = (csvText: string): InspectionItem[] => {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1).map((line, index) => {
    const values = line.split(',');
    
    return {
      id: (index + 1).toString(),
      manufacturer: values[0] || '',
      modelType: values[1] || '',
      engineType: values[2] || '',
      part: values[3] || '',
      device: values[4] || '',
      procedure: values[5] || '',
      checkPoint: values[6] || '',
      judgmentCriteria: values[7] || '',
      checkMethod: values[8] || '',
      measurement: values[9] || '',
      graphicRecord: values[10] || '',
      order: index + 1
    };
  });
};

// 仮のサンプルデータ
const sampleItems: InspectionItem[] = [
  { 
    id: '1', 
    manufacturer: '堀川工機',
    modelType: 'MC300',
    engineType: 'ボルボ',
    part: 'エンジン',
    device: '本体',
    procedure: '',
    checkPoint: 'エンジンヘッドカバー、ターボ',
    judgmentCriteria: 'オイル、燃料漏れ',
    checkMethod: 'オイル等滲み・垂れ跡が無',
    measurement: '',
    graphicRecord: '',
    order: 1
  },
  { 
    id: '2', 
    manufacturer: '',
    modelType: '',
    engineType: '',
    part: 'エンジン',
    device: '本体',
    procedure: '',
    checkPoint: '排気及び吸気',
    judgmentCriteria: '排気ガス色及びガス漏れ等の点検（マフラー等）',
    checkMethod: 'ほぼ透明の薄紫',
    measurement: '',
    graphicRecord: '',
    order: 2
  },
];

export default function InspectionItems() {
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [columns, setColumns] = useState(initialColumns);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isEditItemOpen, setIsEditItemOpen] = useState(false);
  const [isColumnManageOpen, setIsColumnManageOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<InspectionItem | null>(null);
  const [newItemValues, setNewItemValues] = useState<Record<string, string>>({});
  const [newColumnName, setNewColumnName] = useState('');
  const [editColumnId, setEditColumnId] = useState<string | null>(null);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [modelTypes, setModelTypes] = useState<string[]>([]);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('すべて');
  const [selectedModelType, setSelectedModelType] = useState<string>('すべて');
  const [csvContent, setCsvContent] = useState<string>('');
  const [activeTab, setActiveTab] = useState('all');

  // 初期データの読み込み (実際の実装では非同期API呼び出しになる)
  useEffect(() => {
    // CSV形式のサンプルデータを設定
    fetch('/api/inspection/csv')
      .then(res => res.text())
      .then(text => {
        if (text) {
          setCsvContent(text);
          const parsedItems = parseCSVData(text);
          setItems(parsedItems);
          
          // メーカーと機種のリストを作成
          const mfrs = Array.from(new Set(parsedItems.map(item => item.manufacturer).filter(Boolean)));
          const models = Array.from(new Set(parsedItems.map(item => item.modelType).filter(Boolean)));
          
          setManufacturers(['すべて', ...mfrs]);
          setModelTypes(['すべて', ...models]);
        } else {
          setItems(sampleItems);
          setManufacturers(['すべて', '堀川工機']);
          setModelTypes(['すべて', 'MC300']);
        }
      })
      .catch(err => {
        console.error('データの読み込みに失敗しました:', err);
        setItems(sampleItems);
        setManufacturers(['すべて', '堀川工機']);
        setModelTypes(['すべて', 'MC300']);
      });
  }, []);

  // フィルター後のアイテム
  const filteredItems = items.filter(item => {
    if (selectedManufacturer !== 'すべて' && item.manufacturer !== selectedManufacturer) return false;
    if (selectedModelType !== 'すべて' && item.modelType !== selectedModelType) return false;
    return true;
  });

  // 項目の並び替え処理
  const handleItemDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const reorderedItems = Array.from(filteredItems);
    const [removed] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, removed);
    
    // orderの更新
    const updatedItems = reorderedItems.map((item, index) => ({
      ...item,
      order: index + 1
    }));
    
    // 全体のアイテムリストを更新
    const newItems = items.map(item => {
      const found = updatedItems.find(updatedItem => updatedItem.id === item.id);
      return found || item;
    });
    
    setItems(newItems);
    toast({
      title: "並び順を更新しました",
      description: "点検項目の並び順が更新されました。",
    });
  };

  // カラムの並び替え処理
  const handleColumnDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const reorderedColumns = Array.from(columns);
    const [removed] = reorderedColumns.splice(result.source.index, 1);
    reorderedColumns.splice(result.destination.index, 0, removed);
    
    setColumns(reorderedColumns);
    toast({
      title: "カラム順を更新しました",
      description: "カラムの並び順が更新されました。",
    });
  };

  // 新規項目の追加初期化
  const initAddItem = () => {
    const initialValues: Record<string, string> = {};
    columns.forEach(col => {
      initialValues[col.id] = '';
    });
    
    if (selectedManufacturer !== 'すべて') {
      initialValues['manufacturer'] = selectedManufacturer;
    }
    
    if (selectedModelType !== 'すべて') {
      initialValues['modelType'] = selectedModelType;
    }
    
    setNewItemValues(initialValues);
    setIsAddItemOpen(true);
  };

  // 項目の追加
  const handleAddItem = () => {
    const newId = (Math.max(...items.map(item => parseInt(item.id)), 0) + 1).toString();
    
    const newItem: InspectionItem = {
      id: newId,
      manufacturer: newItemValues['manufacturer'] || '',
      modelType: newItemValues['modelType'] || '',
      engineType: newItemValues['engineType'] || '',
      part: newItemValues['part'] || '',
      device: newItemValues['device'] || '',
      procedure: newItemValues['procedure'] || '',
      checkPoint: newItemValues['checkPoint'] || '',
      judgmentCriteria: newItemValues['judgmentCriteria'] || '',
      checkMethod: newItemValues['checkMethod'] || '',
      measurement: newItemValues['measurement'] || '',
      graphicRecord: newItemValues['graphicRecord'] || '',
      order: items.length + 1
    };
    
    setItems([...items, newItem]);
    setIsAddItemOpen(false);
    
    // メーカーリストを更新
    if (newItem.manufacturer && !manufacturers.includes(newItem.manufacturer)) {
      setManufacturers([...manufacturers, newItem.manufacturer]);
    }
    
    // 機種リストを更新
    if (newItem.modelType && !modelTypes.includes(newItem.modelType)) {
      setModelTypes([...modelTypes, newItem.modelType]);
    }
    
    toast({
      title: "項目を追加しました",
      description: `「${newItem.checkPoint}」を追加しました。`,
    });
  };

  // 項目の編集初期化
  const initEditItem = (item: InspectionItem) => {
    setCurrentItem(item);
    
    const initialValues: Record<string, string> = {};
    columns.forEach(col => {
      initialValues[col.id] = item[col.id as keyof InspectionItem]?.toString() || '';
    });
    
    setNewItemValues(initialValues);
    setIsEditItemOpen(true);
  };

  // 項目の編集
  const handleEditItem = () => {
    if (!currentItem) return;
    
    const updatedItem: InspectionItem = {
      ...currentItem,
      manufacturer: newItemValues['manufacturer'] || '',
      modelType: newItemValues['modelType'] || '',
      engineType: newItemValues['engineType'] || '',
      part: newItemValues['part'] || '',
      device: newItemValues['device'] || '',
      procedure: newItemValues['procedure'] || '',
      checkPoint: newItemValues['checkPoint'] || '',
      judgmentCriteria: newItemValues['judgmentCriteria'] || '',
      checkMethod: newItemValues['checkMethod'] || '',
      measurement: newItemValues['measurement'] || '',
      graphicRecord: newItemValues['graphicRecord'] || '',
    };
    
    const updatedItems = items.map(item => 
      item.id === currentItem.id ? updatedItem : item
    );
    
    setItems(updatedItems);
    setIsEditItemOpen(false);
    setCurrentItem(null);
    
    // メーカーリストを更新
    if (updatedItem.manufacturer && !manufacturers.includes(updatedItem.manufacturer)) {
      setManufacturers([...manufacturers, updatedItem.manufacturer]);
    }
    
    // 機種リストを更新
    if (updatedItem.modelType && !modelTypes.includes(updatedItem.modelType)) {
      setModelTypes([...modelTypes, updatedItem.modelType]);
    }
    
    toast({
      title: "項目を更新しました",
      description: `「${updatedItem.checkPoint}」を更新しました。`,
    });
  };

  // 項目の削除
  const handleDeleteItem = (id: string) => {
    const updatedItems = items.filter(item => item.id !== id).map((item, index) => ({
      ...item,
      order: index + 1
    }));
    
    setItems(updatedItems);
    
    toast({
      title: "項目を削除しました",
      description: "点検項目を削除しました。",
    });
  };

  // 新規カラムの追加
  const handleAddColumn = () => {
    if (!newColumnName.trim()) return;
    
    const columnId = newColumnName.toLowerCase().replace(/\s+/g, '_');
    
    if (columns.some(col => col.id === columnId)) {
      toast({
        title: "エラー",
        description: "同じIDのカラムが既に存在します。",
        variant: "destructive"
      });
      return;
    }
    
    const newColumn = {
      id: columnId,
      name: newColumnName,
      required: false
    };
    
    setColumns([...columns, newColumn]);
    setNewColumnName('');
    
    toast({
      title: "カラムを追加しました",
      description: `「${newColumnName}」カラムを追加しました。`,
    });
  };

  // カラム名の編集
  const handleEditColumn = () => {
    if (!editColumnId || !newColumnName.trim()) return;
    
    const updatedColumns = columns.map(col => 
      col.id === editColumnId ? { ...col, name: newColumnName } : col
    );
    
    setColumns(updatedColumns);
    setEditColumnId(null);
    setNewColumnName('');
    
    toast({
      title: "カラム名を更新しました",
      description: `カラム名を「${newColumnName}」に更新しました。`,
    });
  };

  // カラムの削除
  const handleDeleteColumn = (id: string) => {
    // 必須カラムは削除不可
    const columnToDelete = columns.find(col => col.id === id);
    if (columnToDelete?.required) {
      toast({
        title: "削除できません",
        description: "必須カラムは削除できません。",
        variant: "destructive"
      });
      return;
    }
    
    const updatedColumns = columns.filter(col => col.id !== id);
    setColumns(updatedColumns);
    
    toast({
      title: "カラムを削除しました",
      description: "カラムを削除しました。",
    });
  };

  // CSVファイルをインポート
  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvContent(text);
      
      try {
        const parsedItems = parseCSVData(text);
        setItems(parsedItems);
        
        // メーカーと機種のリストを作成
        const mfrs = Array.from(new Set(parsedItems.map(item => item.manufacturer).filter(Boolean)));
        const models = Array.from(new Set(parsedItems.map(item => item.modelType).filter(Boolean)));
        
        setManufacturers(['すべて', ...mfrs]);
        setModelTypes(['すべて', ...models]);
        
        toast({
          title: "CSVをインポートしました",
          description: `${parsedItems.length}件の点検項目をインポートしました。`,
        });
      } catch (err) {
        console.error('CSVのパースに失敗しました:', err);
        toast({
          title: "インポートエラー",
          description: "CSVファイルの形式が正しくありません。",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  // CSVファイルをエクスポート
  const handleExportCSV = () => {
    // CSVデータの作成
    const headers = columns.map(col => col.name).join(',');
    const rows = items.map(item => {
      return columns.map(col => item[col.id as keyof InspectionItem] || '').join(',');
    }).join('\n');
    
    const csv = `${headers}\n${rows}`;
    
    // ダウンロード
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', '点検項目リスト.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast({
      title: "エクスポート完了",
      description: "CSVファイルをエクスポートしました。",
    });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">点検項目管理</h1>
        <div className="flex gap-2">
          <label htmlFor="csv-upload" className="cursor-pointer">
            <Button variant="outline" className="mr-2" onClick={() => document.getElementById('csv-upload')?.click()}>
              <Upload className="mr-2 h-4 w-4" /> CSVインポート
            </Button>
            <input
              id="csv-upload"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleImportCSV}
            />
          </label>
          <Button variant="outline" className="mr-2" onClick={handleExportCSV}>
            <Save className="mr-2 h-4 w-4" /> CSVエクスポート
          </Button>
          <Button onClick={() => setIsColumnManageOpen(true)}>
            カラム管理
          </Button>
          <Button onClick={initAddItem}>
            <Plus className="mr-2 h-4 w-4" /> 点検項目追加
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>フィルター</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="w-full md:w-1/3">
              <Label htmlFor="manufacturer-filter">製造メーカー</Label>
              <Select value={selectedManufacturer} onValueChange={setSelectedManufacturer}>
                <SelectTrigger id="manufacturer-filter">
                  <SelectValue placeholder="メーカーを選択" />
                </SelectTrigger>
                <SelectContent>
                  {manufacturers.map(mfr => (
                    <SelectItem key={mfr} value={mfr}>{mfr}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-1/3">
              <Label htmlFor="model-filter">機種</Label>
              <Select value={selectedModelType} onValueChange={setSelectedModelType}>
                <SelectTrigger id="model-filter">
                  <SelectValue placeholder="機種を選択" />
                </SelectTrigger>
                <SelectContent>
                  {modelTypes.map(model => (
                    <SelectItem key={model} value={model}>{model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">すべて</TabsTrigger>
          <TabsTrigger value="engine">エンジン</TabsTrigger>
          <TabsTrigger value="transmission">動力伝達</TabsTrigger>
          <TabsTrigger value="brake">制動装置</TabsTrigger>
          <TabsTrigger value="electric">電気装置</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>点検項目一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={handleItemDragEnd}>
            <Droppable droppableId="inspection-items">
              {(provided) => (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead className="w-12">No.</TableHead>
                        {columns.map(col => (
                          <TableHead key={col.id}>{col.name}</TableHead>
                        ))}
                        <TableHead className="w-24">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody 
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                    >
                      {filteredItems.filter(item => {
                        if (activeTab === 'all') return true;
                        if (activeTab === 'engine' && item.part === 'エンジン') return true;
                        if (activeTab === 'transmission' && item.part === '動力伝達') return true;
                        if (activeTab === 'brake' && (item.part === '制動装置' || item.part === '駐車ブレーキ')) return true;
                        if (activeTab === 'electric' && item.part === '電気装置') return true;
                        return false;
                      }).map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided) => (
                            <TableRow
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="hover:bg-muted/50"
                            >
                              <TableCell {...provided.dragHandleProps}>
                                <Move className="h-4 w-4 text-muted-foreground" />
                              </TableCell>
                              <TableCell>{item.order}</TableCell>
                              {columns.map(col => (
                                <TableCell key={col.id}>{item[col.id as keyof InspectionItem] || '-'}</TableCell>
                              ))}
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => initEditItem(item)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteItem(item.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </CardContent>
      </Card>

      {/* 項目追加ダイアログ */}
      <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>点検項目追加</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
            {columns.map(col => (
              <div key={col.id} className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={col.id} className="text-right">
                  {col.name} {col.required && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id={col.id}
                  className="col-span-3"
                  value={newItemValues[col.id] || ''}
                  onChange={(e) => setNewItemValues({...newItemValues, [col.id]: e.target.value})}
                  required={col.required}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddItemOpen(false)}>キャンセル</Button>
            <Button onClick={handleAddItem}>追加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 項目編集ダイアログ */}
      <Dialog open={isEditItemOpen} onOpenChange={setIsEditItemOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>点検項目編集</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
            {columns.map(col => (
              <div key={col.id} className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={`edit-${col.id}`} className="text-right">
                  {col.name} {col.required && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id={`edit-${col.id}`}
                  className="col-span-3"
                  value={newItemValues[col.id] || ''}
                  onChange={(e) => setNewItemValues({...newItemValues, [col.id]: e.target.value})}
                  required={col.required}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditItemOpen(false)}>キャンセル</Button>
            <Button onClick={handleEditItem}>更新</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* カラム管理ダイアログ */}
      <Dialog open={isColumnManageOpen} onOpenChange={setIsColumnManageOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>カラム管理</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center space-x-2 mb-4">
              <Input
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                placeholder="新しいカラム名"
                className="flex-1"
              />
              {editColumnId ? (
                <>
                  <Button onClick={handleEditColumn}>更新</Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setEditColumnId(null);
                      setNewColumnName('');
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button onClick={handleAddColumn}>追加</Button>
              )}
            </div>
            <DragDropContext onDragEnd={handleColumnDragEnd}>
              <Droppable droppableId="column-list">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2"
                  >
                    {columns.map((column, index) => (
                      <Draggable key={column.id} draggableId={column.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="flex items-center justify-between p-2 border rounded-md"
                          >
                            <div className="flex items-center">
                              <div {...provided.dragHandleProps} className="mr-2">
                                <Move className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <span>{column.name}</span>
                              {column.required && (
                                <span className="ml-2 text-xs text-destructive">必須</span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditColumnId(column.id);
                                  setNewColumnName(column.name);
                                }}
                                disabled={column.required}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteColumn(column.id)}
                                disabled={column.required}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
