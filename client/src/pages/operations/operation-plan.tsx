import React, { useState } from 'react';

export default function OperationPlanPage() {
  const [date, setDate] = useState(new Date());
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [operationType, setOperationType] = useState("");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [description, setDescription] = useState("");
  const [responsible, setResponsible] = useState("");
  const [operator, setOperator] = useState("");
  const [remarks, setRemarks] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // フォームの送信処理
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">運用計画記録</h2>
        <button className="text-sm text-blue-500" onClick={() => window.print()}>
          保存して終える
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 bg-gray-800 text-white py-2 px-4 rounded">
            運用計画フォーム
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">運用日</label>
                <input
                  type="date"
                  value={date.toISOString().split('T')[0]}
                  onChange={(e) => setDate(new Date(e.target.value))}
                  className="w-full border rounded p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">車両番号</label>
                <select
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  className="w-full border rounded p-2"
                >
                  <option value="">車両を選択</option>
                  {/* 車両リスト */}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">車両区分</label>
                <select
                  value={operationType}
                  onChange={(e) => setOperationType(e.target.value)}
                  className="w-full border rounded p-2"
                >
                  <option value="">区分を選択</option>
                  {/* 区分リスト */}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">運用区間</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="例: 東京駅～新宿駅"
                  className="w-full border rounded p-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">予定出発時刻</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full border rounded p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">予定終了時刻</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full border rounded p-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">作業目的</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="作業目的を入力"
                className="w-full border rounded p-2 h-24"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">責任者</label>
                <input
                  type="text"
                  value={responsible}
                  onChange={(e) => setResponsible(e.target.value)}
                  placeholder="責任者名を入力"
                  className="w-full border rounded p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">運転者</label>
                <input
                  type="text"
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  placeholder="運転者名を入力"
                  className="w-full border rounded p-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">備考（任意）</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="備考事項があれば入力してください"
                className="w-full border rounded p-2 h-24"
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-100"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                登録
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}