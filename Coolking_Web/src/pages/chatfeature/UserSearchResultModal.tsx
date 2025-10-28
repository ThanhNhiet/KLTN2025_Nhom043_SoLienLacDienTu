import React, { useState } from 'react';

interface SearchResult {
    student_id?: string;
    lecturer_id?: string;
    name?: string;
    avatar?: string | null;
    type?: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSearch: (keyword: string) => Promise<any>;
    onSelect: (result: SearchResult) => void;
}

const UserSearchResultModal: React.FC<Props> = ({ isOpen, onClose, onSearch, onSelect }) => {
    const [keyword, setKeyword] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<SearchResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSearch = async () => {
        if (!keyword.trim()) return;
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const data = await onSearch(keyword.trim());
            if (data && data.success && data.result) {
                setResult(data.result);
            } else {
                setError(data?.message || 'Không tìm thấy người dùng');
            }
        } catch (err: any) {
            setError(err?.message || 'Lỗi khi tìm kiếm');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-md p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">Tìm kiếm người dùng</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>

                <div className="mb-3">
                    <div className="flex items-center space-x-2">
                        <input
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="Nhập userID, email hoặc phone"
                            className="flex-1 p-2 border border-gray-300 rounded-lg"
                        />
                        <button
                            onClick={handleSearch}
                            disabled={loading}
                            className="px-3 py-2 bg-blue-500 text-white rounded-lg"
                        >
                            {loading ? 'Đang...' : 'Tìm'}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="text-sm text-red-500 mb-3">{error}</div>
                )}

                {result ? (
                    <div className="p-3 border rounded-lg flex items-center">
                        <img src={result.avatar || 'https://res.cloudinary.com/dplg9r6z1/image/upload/v1760607108/no-image_z1mtgf.jpg'} alt={result.name} className="w-12 h-12 rounded-full object-cover mr-3" />
                        <div className="flex-1">
                            <div className="font-medium">{result.name}</div>
                            <div className="text-xs text-gray-500">{result.student_id || result.lecturer_id} • {result.type}</div>
                        </div>
                        <button
                            onClick={() => onSelect(result)}
                            className="px-3 py-2 bg-green-500 text-white rounded-lg"
                        >Chọn</button>
                    </div>
                ) : (
                    <div className="text-sm text-gray-500">Nhập và nhấn Tìm để tìm người dùng</div>
                )}

                <div className="mt-4 flex justify-end">
                    <button onClick={onClose} className="px-3 py-2 bg-gray-200 rounded-lg">Đóng</button>
                </div>
            </div>
        </div>
    );
};

export default UserSearchResultModal;
