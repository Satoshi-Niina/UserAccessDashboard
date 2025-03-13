import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileX, FileText, Image, ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useNavigate } from 'react-router-dom';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";


function TechSupportData() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedFiles, setProcessedFiles] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileData, setFileData] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { toast } = useToast();
  const [hasChanges, setHasChanges] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // 処理済みファイル一覧を取得
    fetchProcessedFiles();
  }, []);

  const fetchProcessedFiles = async () => {
    try {
      const response = await fetch('/api/tech-support/files');
      const data = await response.json();
      if (data.files) {
        setProcessedFiles(data.files);
      }
    } catch (error) {
      console.error('データ読み込みエラー:', error);
      toast({
        title: "エラー",
        description: "処理済みファイルの取得に失敗しました",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();

      if (fileExtension === 'pptx' || fileExtension === 'xlsx' || fileExtension === 'xls') {
        setFile(selectedFile);
      } else {
        toast({
          title: "エラー",
          description: "PPTXまたはExcel（XLSXまたはXLS）ファイルを選択してください",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "エラー",
        description: "ファイルを選択してください",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 500);

      const response = await fetch('/api/tech-support/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "成功",
          description: `ファイルが正常に処理されました。画像数: ${result.imageCount}`,
        });
        setFile(null);
        // 処理済みファイル一覧を更新
        fetchProcessedFiles();
        setHasChanges(true); //add this line
      } else {
        const error = await response.json();
        toast({
          title: "エラー",
          description: error.error || "ファイルのアップロードに失敗しました",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "ファイルのアップロードに失敗しました",
        variant: "destructive",
      });
      console.error('アップロードエラー:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = async (fileName: string) => {
    setSelectedFile(fileName);
    try {
      const response = await fetch(`/api/tech-support/data/${fileName}`);
      if (response.ok) {
        const data = await response.json();
        setFileData(data);
      } else {
        toast({
          title: "エラー",
          description: "データの取得に失敗しました",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('データ取得エラー:', error);
      toast({
        title: "エラー",
        description: "データの取得に失敗しました",
        variant: "destructive",
      });
    }
  };

  const openImagePreview = (imageName: string) => {
    setSelectedImage(imageName);
  };

  // 保存して終了する関数
  const handleSaveAndExit = async () => {
    try {
      // ここで保存処理を行う（現状はアップロード時に保存しているため、追加処理は不要）
      toast({
        title: "保存完了",
        description: "変更が正常に保存されました。",
      });
      setHasChanges(false);
      navigate("/settings");
    } catch (error) {
      console.error("保存エラー:", error);
      toast({
        variant: "destructive",
        title: "保存エラー",
        description: "変更の保存中にエラーが発生しました。",
      });
    }
  };

  // 戻るボタンの処理
  const handleBack = () => {
    if (hasChanges) {
      setShowConfirmDialog(true);
    } else {
      navigate("/settings");
    }
  };

  // 確認ダイアログで「確認」をクリックした場合
  const handleConfirmBack = async () => {
    await handleSaveAndExit();
    setShowConfirmDialog(false);
  };

  // 確認ダイアログで「破棄」をクリックした場合
  const handleDiscardBack = () => {
    setHasChanges(false);
    setShowConfirmDialog(false);
    navigate("/settings");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">技術支援データ処理</h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleBack} className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            戻る
          </Button>
          <Button onClick={handleSaveAndExit} className="flex items-center gap-1">
            <Save className="h-4 w-4" />
            保存して終了
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>技術支援データ処理</CardTitle>
          <CardDescription>
            PowerPointまたはExcelファイルをアップロードして、画像とテキストに分割します。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file-upload">ファイルを選択</Label>
              <div className="flex mt-2">
                <input
                  id="file-upload"
                  type="file"
                  onChange={handleFileChange}
                  accept=".pptx,.xlsx,.xls"
                  className="w-full"
                  disabled={isUploading}
                />
              </div>
              {file && (
                <div className="mt-2 text-sm text-muted-foreground">
                  選択されたファイル: {file.name}
                </div>
              )}
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>処理中...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleUpload} 
            disabled={!file || isUploading} 
            className="w-full"
          >
            {isUploading ? '処理中...' : 'ファイルを処理'}
            <Upload className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>処理済みファイル</CardTitle>
          <CardDescription>
            処理済みのファイル一覧です。クリックしてデータを表示します。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {processedFiles.length > 0 ? (
              processedFiles.map((file, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className={`w-full justify-start ${selectedFile === file.name ? 'bg-muted' : ''}`}
                  onClick={() => handleFileSelect(file.name)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {file.name}
                </Button>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <FileX className="mx-auto h-8 w-8 mb-2" />
                処理済みファイルがありません
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {fileData && (
        <Card>
          <CardHeader>
            <CardTitle>{fileData.title || '処理済みデータ'}</CardTitle>
            <CardDescription>
              処理結果の詳細情報
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="text">
              <TabsList>
                <TabsTrigger value="text">テキスト</TabsTrigger>
                <TabsTrigger value="images">画像</TabsTrigger>
              </TabsList>
              <TabsContent value="text" className="mt-4">
                {fileData.slides ? (
                  <div className="space-y-4">
                    {fileData.slides.map((slide: any, index: number) => (
                      <div key={index} className="border p-4 rounded-md">
                        <h4 className="font-medium mb-2">スライド {slide.slideNumber}</h4>
                        <p>{slide.text}</p>
                      </div>
                    ))}
                  </div>
                ) : fileData.sheets ? (
                  <div className="space-y-4">
                    {fileData.sheets.map((sheet: any, index: number) => (
                      <div key={index} className="border p-4 rounded-md">
                        <h4 className="font-medium mb-2">シート: {sheet.name}</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr>
                                {sheet.rows[0] && Object.keys(sheet.rows[0]).map((key: string) => (
                                  <th key={key} className="border px-2 py-1">{key}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {sheet.rows.map((row: any, rowIndex: number) => (
                                <tr key={rowIndex}>
                                  {Object.values(row).map((cell: any, cellIndex: number) => (
                                    <td key={cellIndex} className="border px-2 py-1">{cell}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    テキストデータがありません
                  </div>
                )}
              </TabsContent>
              <TabsContent value="images" className="mt-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {fileData.slides && fileData.slides.flatMap((slide: any) => 
                    slide.images ? slide.images.map((img: any, imgIndex: number) => (
                      <Dialog key={imgIndex}>
                        <DialogTrigger asChild>
                          <div className="border rounded-md overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                            <img 
                              src={`/api/tech-support/images/${img.fileName}`} 
                              alt={`スライド ${slide.slideNumber} 画像 ${imgIndex + 1}`}
                              className="w-full h-32 object-cover"
                            />
                            <div className="p-2 text-xs">
                              スライド {slide.slideNumber} 画像 {imgIndex + 1}
                            </div>
                          </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>スライド {slide.slideNumber} 画像 {imgIndex + 1}</DialogTitle>
                          </DialogHeader>
                          <div className="mt-4">
                            <img 
                              src={`/api/tech-support/images/${img.fileName}`} 
                              alt={`スライド ${slide.slideNumber} 画像 ${imgIndex + 1}`}
                              className="w-full h-auto max-h-[600px] object-contain"
                            />
                          </div>
                          <div className="mt-4">
                            <h4 className="font-medium">関連テキスト:</h4>
                            <p className="mt-2">{slide.text}</p>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )) : []
                  )}
                  {!fileData.slides || !fileData.slides.some((s: any) => s.images && s.images.length > 0) && (
                    <div className="col-span-full text-center py-4 text-muted-foreground">
                      <Image className="mx-auto h-8 w-8 mb-2" />
                      画像がありません
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* 確認ダイアログ */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>変更を保存しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              保存されていない変更があります。保存して終了しますか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handleDiscardBack()}>破棄</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleConfirmBack()}>確認</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default TechSupportData;