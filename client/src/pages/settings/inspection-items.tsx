
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
import { Plus, Edit, Trash2, Move, Upload, Save, X, FileUp, FileDown } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Sidebar } from "@/components/layout/sidebar";
import { ExitButton } from "@/components/layout/exit-button";

// 点検項目のインターフェース
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

// カラム定義のインターフェース
interface ColumnDefinition {
  id: string;
  name: string;
  required: boolean;
}

// 初期カラム定義
const initialColumns: ColumnDefinition[] = [
  { id: 'manufacturer', name: '製造メーカー', required: true },
  { id: 'modelType', name: '機種', required: true },
  { id: 'engineType', name: 'エンジン型式', required: false },
  { id: 'part', name: '部位', required: true },
  { id: 'device', name: '装置', required: true },
  { id: 'procedure', name: '手順', required: false },
  { id: 'checkPoint', name: '確認箇所', required: true },
  { id: 'judgmentCriteria', name: '判断基準', required: true },
  { id: 'checkMethod', name: '確認要領', required: true },
  { id: 'measurement', name: '測定等記録', required: false },
  { id: 'graphicRecord', name: '図形記録', required: false },
];

// CSVデータのパース関数
const parseCSVData = (csv: string): InspectionItem[] => {
  const lines = csv.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  // ヘッダーとinitialColumnsのマッピング
  const headerMap: Record<string, string> = {
    '製造メーカー': 'manufacturer',
    '機種': 'modelType',
    'エンジン型式': 'engineType',
    '部位': 'part',
    '装置': 'device',
    '手順': 'procedure',
    '確認箇所': 'checkPoint',
    '判断基準': 'judgmentCriteria',
    '確認要領': 'checkMethod',
    '測定等記録': 'measurement',
    '図形記録': 'graphicRecord',
  };

  return lines.slice(1).filter(line => line.trim()).map((line, index) => {
    const values = line.split(',').map(v => v.trim());
    const item: any = { id: `item-${index + 1}`, order: index + 1 };
    
    headers.forEach((header, i) => {
      const field = headerMap[header] || header;
      item[field] = values[i] || '';
    });
    
    return item as InspectionItem;
  });
};

// CSVデータの生成関数
const generateCSVData = (items: InspectionItem[], columns: ColumnDefinition[]): string => {
  // ヘッダー行
  const headers = columns.map(col => {
    const headerName = initialColumns.find(c => c.id === col.id)?.name || col.name;
    return headerName;
  });
  
  const headerRow = headers.join(',');
  
  // データ行
  const dataRows = items.map(item => {
    return columns.map(col => {
      const value = (item as any)[col.id] || '';
      // カンマを含む場合はダブルクォートで囲む
      return value.includes(',') ? `"${value}"` : value;
    }).join(',');
  });
  
  return [headerRow, ...dataRows].join('\n');
};

// サンプルデータ
const sampleItems: InspectionItem[] = [
  {
    id: 'item-1',
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
    id: 'item-2',
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
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null);

  // 初期データの読み込み
  useEffect(() => {
    // APIまたはローカルファイルからCSVデータを取得
    // 実際の実装ではサーバーからデータを取得する
    fetch('/api/inspection-items')
      .then(res => res.text())
      .catch(() => {
        // APIが失敗した場合、ローカルのサンプルデータを使用
        // 本番環境では適切なエラーハンドリングが必要
        return '製造メーカー,機種,エンジン型式,部位,装置,手順,確認箇所,判断基準,確認要領,測定等記録,図形記録\n堀川工機,MC300,ボルボ,エンジン,本体,,エンジンヘッドカバー、ターボ,オイル、燃料漏れ,オイル等滲み・垂れ跡が無,,\n,,,エンジン,本体,,排気及び吸気,排気ガス色及びガス漏れ等の点検（マフラー等）,ほぼ透明の薄紫,,';
      })
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
    if (selectedManufacturer !== 'すべて' && item.manufacturer !== selectedManufacturer) {
      return false;
    }
    if (selectedModelType !== 'すべて' && item.modelType !== selectedModelType) {
      return false;
    }
    
    // タブによるフィルタリング
    if (activeTab === 'engine' && item.part === 'エンジン') return true;
    if (activeTab === 'transmission' && item.part === '動力伝達') return true;
    if (activeTab === 'brake' && (item.part === '制動装置' || item.part === '駐車ブレーキ')) return true;
    if (activeTab === 'electric' && item.part === '電気装置') return true;
    if (activeTab === 'all') return true;
    
    return false;
  });

  // アイテムのドラッグ終了時の処理
  const handleItemDragEnd = (result: any) => {
    if (!result.destination) {
      return;
    }

    const reorderedItems = Array.from(filteredItems);
    const [removed] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, removed);

    // 順序を更新
    const updatedItems = reorderedItems.map((item, index) => ({
      ...item,
      order: index + 1
    }));

    // 全アイテムリストの該当アイテムを更新
    const allItemsUpdated = items.map(item => {
      const updatedItem = updatedItems.find(updated => updated.id === item.id);
      return updatedItem || item;
    });

    setItems(allItemsUpdated);

    toast({
      title: "項目の順序を更新しました",
      description: "ドラッグアンドドロップで項目の順序を変更しました。",
    });
  };

  // カラムのドラッグ終了時の処理
  const handleColumnDragEnd = (result: any) => {
    if (!result.destination) {
      return;
    }

    const reorderedColumns = Array.from(columns);
    const [removed] = reorderedColumns.splice(result.source.index, 1);
    reorderedColumns.splice(result.destination.index, 0, removed);

    setColumns(reorderedColumns);

    toast({
      title: "カラムの順序を更新しました",
      description: "ドラッグアンドドロップでカラムの順序を変更しました。",
    });
  };

  // 新規項目の追加
  const handleAddItem = () => {
    const newItem: InspectionItem = {
      id: `item-${Date.now()}`,
      manufacturer: selectedManufacturer !== 'すべて' ? selectedManufacturer : newItemValues['manufacturer'] || '',
      modelType: selectedModelType !== 'すべて' ? selectedModelType : newItemValues['modelType'] || '',
      engineType: newItemValues['engineType'] || '',
      part: newItemValues['part'] || 'エンジン',
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
    setNewItemValues({});

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

  // 項目の編集
  const handleEditItem = () => {
    if (!currentItem) return;

    const updatedItem: InspectionItem = {
      ...currentItem,
      manufacturer: newItemValues['manufacturer'] || currentItem.manufacturer,
      modelType: newItemValues['modelType'] || currentItem.modelType,
      engineType: newItemValues['engineType'] || currentItem.engineType,
      part: newItemValues['part'] || currentItem.part,
      device: newItemValues['device'] || currentItem.device,
      procedure: newItemValues['procedure'] || currentItem.procedure,
      checkPoint: newItemValues['checkPoint'] || currentItem.checkPoint,
      judgmentCriteria: newItemValues['judgmentCriteria'] || currentItem.judgmentCriteria,
      checkMethod: newItemValues['checkMethod'] || currentItem.checkMethod,
      measurement: newItemValues['measurement'] || currentItem.measurement,
      graphicRecord: newItemValues['graphicRecord'] || currentItem.graphicRecord,
    };

    const updatedItems = items.map(item => 
      item.id === currentItem.id ? updatedItem : item
    );

    setItems(updatedItems);
    setIsEditItemOpen(false);
    setCurrentItem(null);
    setNewItemValues({});

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
    if (columns.find(col => col.id === id)?.required) {
      toast({
        title: "エラー",
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

  // CSVのエクスポート
  const handleExportCSV = () => {
    const csvData = generateCSVData(items, columns);
    
    // CSVデータをBlobに変換
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    
    // ダウンロードリンクを作成
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', '点検項目リスト.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "CSVをエクスポートしました",
      description: "点検項目リストをCSVファイルとしてダウンロードしました。",
    });
  };

  // CSVのインポート
  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        setCsvContent(text);
        const parsedItems = parseCSVData(text);
        setItems(parsedItems);

        // メーカーと機種のリストを更新
        const mfrs = Array.from(new Set(parsedItems.map(item => item.manufacturer).filter(Boolean)));
        const models = Array.from(new Set(parsedItems.map(item => item.modelType).filter(Boolean)));

        setManufacturers(['すべて', ...mfrs]);
        setModelTypes(['すべて', ...models]);

        toast({
          title: "CSVをインポートしました",
          description: `${parsedItems.length}件の点検項目をインポートしました。`,
        });
      }
    };
    reader.readAsText(file);
    
    // ファイル選択をリセット
    if (event.target) {
      event.target.value = '';
    }
    setIsImportDialogOpen(false);
  };

  // 変更の保存
  const handleSaveChanges = () => {
    const csvData = generateCSVData(items, columns);
    
    // 実際の実装ではAPIを呼び出して保存
    console.log('保存するCSVデータ:', csvData);
    
    // モックのAPI呼び出し
    new Promise(resolve => setTimeout(resolve, 500))
      .then(() => {
        toast({
          title: "変更を保存しました",
          description: "点検項目リストの変更を保存しました。",
        });
      })
      .catch(err => {
        console.error('保存に失敗しました:', err);
        toast({
          title: "エラー",
          description: "変更の保存に失敗しました。",
          variant: "destructive"
        });
      });
  };

  return (
    <div className="flex h-screen">
      <Sidebar onExpandChange={setIsMenuExpanded} />
      <div className={`flex-1 ${isMenuExpanded ? 'ml-64' : 'ml-16'} transition-all duration-300`}>
        <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">点検項目管理</h1>
            <ExitButton />
          </div>

          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex-1">
                  <Label htmlFor="manufacturer">製造メーカー</Label>
                  <Select 
                    value={selectedManufacturer} 
                    onValueChange={setSelectedManufacturer}
                  >
                    <SelectTrigger id="manufacturer">
                      <SelectValue placeholder="製造メーカーを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {manufacturers.map(mfr => (
                        <SelectItem key={mfr} value={mfr}>{mfr}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1">
                  <Label htmlFor="modelType">機種</Label>
                  <Select 
                    value={selectedModelType} 
                    onValueChange={setSelectedModelType}
                  >
                    <SelectTrigger id="modelType">
                      <SelectValue placeholder="機種を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {modelTypes.map(model => (
                        <SelectItem key={model} value={model}>{model}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end space-x-2">
                  <Button onClick={() => setIsAddItemOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    新規追加
                  </Button>
                  <Button variant="outline" onClick={() => setIsColumnManageOpen(true)}>
                    カラム管理
                  </Button>
                </div>
              </div>

              <div className="flex justify-between mb-4">
                <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList>
                    <TabsTrigger value="all">すべて</TabsTrigger>
                    <TabsTrigger value="engine">エンジン</TabsTrigger>
                    <TabsTrigger value="transmission">動力伝達</TabsTrigger>
                    <TabsTrigger value="brake">制動装置</TabsTrigger>
                    <TabsTrigger value="electric">電気装置</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
                    <FileUp className="h-4 w-4 mr-2" />
                    インポート
                  </Button>
                  <Button variant="outline" onClick={handleExportCSV}>
                    <FileDown className="h-4 w-4 mr-2" />
                    エクスポート
                  </Button>
                  <Button onClick={handleSaveChanges}>
                    <Save className="h-4 w-4 mr-2" />
                    保存
                  </Button>
                </div>
              </div>

              <DragDropContext onDragEnd={handleItemDragEnd}>
                <Droppable droppableId="items-table">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="border rounded-md"
                    >
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-10"></TableHead>
                            {columns.map(col => (
                              <TableHead key={col.id}>{col.name}</TableHead>
                            ))}
                            <TableHead className="w-20">操作</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredItems.map((item, index) => (
                            <Draggable key={item.id} draggableId={item.id} index={index}>
                              {(provided) => (
                                <TableRow
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className="hover:bg-muted/50"
                                >
                                  <TableCell {...provided.dragHandleProps} className="w-10">
                                    <Move className="h-4 w-4 text-muted-foreground" />
                                  </TableCell>
                                  {columns.map(col => (
                                    <TableCell key={col.id}>{(item as any)[col.id] || '-'}</TableCell>
                                  ))}
                                  <TableCell className="w-20">
                                    <div className="flex space-x-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                          setCurrentItem(item);
                                          setNewItemValues({});
                                          setIsEditItemOpen(true);
                                        }}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteItem(item.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
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
        </main>
      </div>

      {/* 新規項目追加ダイアログ */}
      <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>新規点検項目の追加</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            {columns.map(col => (
              <div key={col.id} className="flex flex-col space-y-1.5">
                <Label htmlFor={`new-${col.id}`}>{col.name}{col.required && ' *'}</Label>
                <Input
                  id={`new-${col.id}`}
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
            <DialogTitle>点検項目の編集</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            {columns.map(col => (
              <div key={col.id} className="flex flex-col space-y-1.5">
                <Label htmlFor={`edit-${col.id}`}>{col.name}{col.required && ' *'}</Label>
                <Input
                  id={`edit-${col.id}`}
                  value={newItemValues[col.id] !== undefined ? newItemValues[col.id] : currentItem?.[col.id as keyof InspectionItem] as string || ''}
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
                <Button onClick={handleAddColumn}>
                  <Plus className="h-4 w-4 mr-2" />
                  追加
                </Button>
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
                              <div {...provided.dragHandleProps} className="pr-2">
                                <Move className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <span>{column.name}</span>
                              {column.required && (
                                <span className="ml-2 text-sm text-red-500">*必須</span>
                              )}
                            </div>
                            <div className="flex space-x-1">
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
                                <Trash2 className="h-4 w-4" />
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
          <DialogFooter>
            <Button onClick={() => setIsColumnManageOpen(false)}>閉じる</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSVインポートダイアログ */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>CSVファイルのインポート</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4 text-sm text-muted-foreground">
              CSVファイルを選択してインポートします。現在のデータは上書きされます。
            </p>
            <Input 
              type="file" 
              accept=".csv" 
              onChange={handleImportCSV} 
              ref={(input) => setFileInputRef(input)} 
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>キャンセル</Button>
            <Button onClick={() => fileInputRef?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              ファイルを選択
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
