import { useRef, useEffect, useState } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

    // 初期計算と定期的な更新を設定
    setTimeout(handleScroll, 100);
    
    // 更新を毎秒行って確実に表示されるようにする
    const intervalId = setInterval(handleScroll, 1000);

    return () => {
      window.removeEventListener('resize', handleScroll);
      scrollContainer.removeEventListener('scroll', handleScroll);
      clearInterval(intervalId);
    };
  }, [data]); // dataが変わった時にも再計算

  // 左右スクロール関数
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -100, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 100, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col gap-2 relative">
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

      {/* 左右スクロールボタン */}
      <div className="flex justify-between absolute top-1/2 w-full px-1 z-20 pointer-events-none">
        <button 
          onClick={scrollLeft}
          className="bg-white/80 rounded-full p-1 shadow hover:bg-white transition-colors pointer-events-auto"
          aria-label="左へスクロール"
        >
          <ChevronLeft size={20} />
        </button>
        <button 
          onClick={scrollRight}
          className="bg-white/80 rounded-full p-1 shadow hover:bg-white transition-colors pointer-events-auto"
          aria-label="右へスクロール"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Table container with scroll */}
      <div 
        ref={scrollContainerRef} 
        className="w-full overflow-x-scroll border rounded-md"
        style={{ msOverflowStyle: 'scrollbar', scrollbarWidth: 'auto' }}
      >
        <div style={{ minWidth: '100%', width: 'max-content' }}>
          <Table className="table-with-fixed-height">
            <TableHeader>
              <TableRow>
                {headers.map((header, i) => (
                  <TableHead 
                    key={i} 
                    className={header === '装置' ? 'min-w-[20ch] w-[20ch]' : (
                      header === '測定等記録' || header === '図形記録' || header === '結果' 
                      ? 'min-w-[15ch] w-[15ch]' : ''
                    )}
                    style={header === '装置' 
                      ? {width: '20ch', minWidth: '20ch'} 
                      : (header === '測定等記録' || header === '図形記録' || header === '結果' 
                        ? {width: '15ch', minWidth: '15ch'} 
                        : {}
                      )
                    }
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