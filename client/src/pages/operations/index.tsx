
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, FileText, Calendar, ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";

export default function OperationsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">運用管理</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* 運用計画登録 */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              運用計画
            </CardTitle>
            <CardDescription>
              保守用車の運用計画を登録します
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            作業日時、運転区間、作業目的などの運用計画情報を登録できます。
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link to="/operations/operational-plan">
                <PlusCircle className="mr-2 h-4 w-4" />
                新規登録
              </Link>
            </Button>
          </CardFooter>
        </Card>
        
        {/* 運用実績登録 */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              運用実績
            </CardTitle>
            <CardDescription>
              保守用車の運用実績を記録します
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            実際の運用時間、走行距離、作業内容などの実績情報を登録できます。
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link to="/operations/operational-record">
                <PlusCircle className="mr-2 h-4 w-4" />
                新規登録
              </Link>
            </Button>
          </CardFooter>
        </Card>
        
        {/* 運用状況確認 */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <ClipboardList className="w-5 h-5 mr-2" />
              運用状況確認
            </CardTitle>
            <CardDescription>
              保守用車の運用状況を確認します
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            計画・実績を含めた運用状況の一覧表示や検索・フィルタリングができます。
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link to="/operations/status">
                確認する
              </Link>
            </Button>
          </CardFooter>
        </Card>
        
      </div>
    </div>
  );
}
