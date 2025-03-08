import React, { useRef, useEffect, useState } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

interface ScrollableTableProps {
  headers: string[];
  data: any[];
  renderRow: (item: any, index: number) => React.ReactNode;
}

export function ScrollableTable({ headers, data, renderRow }: ScrollableTableProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollIndicatorWidth, setScrollIndicatorWidth] = useState(100);
  const [scrollIndicatorLeft, setScrollIndicatorLeft] = useState(0);

  // Handle scroll events to update the scroll indicator
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
      const maxScrollLeft = scrollWidth - clientWidth;

      if (maxScrollLeft > 0) {
        const indicatorWidth = Math.max((clientWidth / scrollWidth) * 100, 10); // 最小幅を10%に設定
        const indicatorLeft = (scrollLeft / maxScrollLeft) * (100 - indicatorWidth);

        setScrollIndicatorWidth(indicatorWidth);
        setScrollIndicatorLeft(indicatorLeft);
      } else {
        setScrollIndicatorWidth(100);
        setScrollIndicatorLeft(0);
      }
    };

    // スクロールとウィンドウリサイズイベントでインジケーターを更新
    scrollContainer.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);

    // 初期計算（少し遅延させて確実にDOMが反映された後に計算）
    setTimeout(handleScroll, 100);

    return () => {
      window.removeEventListener('resize', handleScroll);
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [data]); // dataが変わった時にも再計算

  return (
    <div className="flex flex-col gap-2">
      {/* Scroll indicator */}
      <div className="table-scroll-indicator">
        <div 
          className="table-scroll-indicator-inner" 
          style={{ 
            width: `${scrollIndicatorWidth}%`, 
            left: `${scrollIndicatorLeft}%` 
          }}
        />
      </div>

      {/* Table container with scroll */}
      <div 
        ref={scrollContainerRef} 
        className="w-full overflow-x-auto border rounded-md"
      >
        <div style={{ minWidth: '100%', width: 'max-content' }}>
          <Table className="table-with-fixed-height">
            <TableHeader>
              <TableRow>
                {headers.map((header, i) => (
                  <TableHead 
                    key={i} 
                    className={header === '装置' ? 'min-w-[15ch] w-[15ch]' : ''}
                    style={header === '装置' ? {width: '15ch', minWidth: '15ch'} : {}}
                  >
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, i) => renderRow(item, i))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}