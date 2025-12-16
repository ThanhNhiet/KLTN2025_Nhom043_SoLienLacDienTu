import React, { useState, useRef } from 'react';
import { useDataImport, type ImportType } from '../../../hooks/useDataImport';
import HeaderAdCpn from '../../../components/admin/HeaderAdCpn';
import FooterAdCpn from '../../../components/admin/FooterAdCpn';

interface ImportCard {
  type: ImportType;
  title: string;
  description: string;
  acceptedFiles: string;
  color: string;
}

const DataImportPage: React.FC = () => {
  const { loading, error, message, importResult, importData, downloadTemplate} = useDataImport();
  const [selectedFiles, setSelectedFiles] = useState<{ [key in ImportType]?: File[] }>({});
  const [dragOver, setDragOver] = useState<{ [key in ImportType]?: boolean }>({});
  
  // Refs for file inputs
  const fileInputRefs = useRef<{ [key in ImportType]?: HTMLInputElement | null }>({});

  const importCards: ImportCard[] = [
    {
      type: 'schedules',
      title: 'Lịch học',
      description: 'Import dữ liệu lịch học từ file CSV',
      acceptedFiles: '.csv',
      color: 'gray-500'
    },
    {
      type: 'schedule-exceptions',
      title: 'Lịch ngoại lệ', 
      description: 'Import dữ liệu lịch ngoại lệ từ file CSV',
      acceptedFiles: '.csv',
      color: 'gray-500'
    },
    {
      type: 'scores',
      title: 'Điểm số',
      description: 'Import dữ liệu điểm số từ file CSV',
      acceptedFiles: '.csv',
      color: 'gray-500'
    }
  ];

  // Handle file selection
  const handleFileSelect = (type: ImportType, files: FileList | null) => {
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      setSelectedFiles(prev => ({ ...prev, [type]: fileArray }));
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent, type: ImportType) => {
    e.preventDefault();
    setDragOver(prev => ({ ...prev, [type]: true }));
  };

  const handleDragLeave = (e: React.DragEvent, type: ImportType) => {
    e.preventDefault();
    setDragOver(prev => ({ ...prev, [type]: false }));
  };

  const handleDrop = (e: React.DragEvent, type: ImportType) => {
    e.preventDefault();
    setDragOver(prev => ({ ...prev, [type]: false }));
    const files = e.dataTransfer.files;
    handleFileSelect(type, files);
  };

  // Handle import
  const handleImport = async (type: ImportType) => {
    const files = selectedFiles[type];
    if (!files || files.length === 0) {
      alert('Vui lòng chọn file để import');
      return;
    }

    await importData(type, files);
  };

  // Handle download template
  const handleDownloadTemplate = async (type: ImportType) => {
    await downloadTemplate(type);
  };

  // Clear selected files
  const handleClearFiles = (type: ImportType) => {
    setSelectedFiles(prev => ({ ...prev, [type]: undefined }));
    if (fileInputRefs.current[type]) {
      fileInputRefs.current[type]!.value = '';
    }
  };

  // Toast notification
  const showToast = (msg: string, type: 'success' | 'error') => {
    // Simple alert for now - can be replaced with proper toast component
    if (type === 'success') {
      alert('✅ ' + msg);
    } else {
      alert('❌ ' + msg);
    }
  };

  // Show results when import is complete
  React.useEffect(() => {
    if (message && importResult) {
      const resultMsg = `${message}\n\nKết quả:\n- Đã xử lý: ${importResult.processed}\n- Đã thêm mới: ${importResult.inserted}\n- Đã cập nhật: ${importResult.updated}\n- Lỗi: ${importResult.errors.length}`;
      showToast(resultMsg, 'success');
    }
  }, [message, importResult]);

  React.useEffect(() => {
    if (error) {
      showToast(error, 'error');
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HeaderAdCpn />
      
      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Import Dữ liệu</h1>
          <p className="text-gray-600">Import dữ liệu từ file CSV vào hệ thống</p>
        </div>

        {/* Import Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {importCards.map((card) => {
            const files = selectedFiles[card.type];
            const isDragOver = dragOver[card.type] || false;
            
            return (
              <div
                key={card.type}
                className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow duration-200"
              >
                {/* Card Header */}
                <div className={`bg-${card.color} text-white p-6 rounded-t-xl`}>
                  <div className="flex items-center mb-3">
                    <div>
                      <h3 className="text-xl font-semibold">{card.title}</h3>
                      <p className="text-white/80 text-sm">{card.description}</p>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6">
                  {/* File Drop Zone */}
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
                      isDragOver
                        ? 'border-blue-400 bg-blue-50'
                        : files && files.length > 0
                        ? 'border-green-400 bg-green-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragOver={(e) => handleDragOver(e, card.type)}
                    onDragLeave={(e) => handleDragLeave(e, card.type)}
                    onDrop={(e) => handleDrop(e, card.type)}
                  >
                    <input
                      ref={(el) => { fileInputRefs.current[card.type] = el }}
                      type="file"
                      accept={card.acceptedFiles}
                      multiple
                      onChange={(e) => handleFileSelect(card.type, e.target.files)}
                      className="hidden"
                      id={`file-input-${card.type}`}
                    />
                    
                    {files && files.length > 0 ? (
                      <div className="space-y-2">
                        <div className="text-green-600 text-lg font-medium">✅ Đã chọn {files.length} file</div>
                        {files.map((file, index) => (
                          <div key={index} className="text-sm text-gray-600">
                            {file.name} ({Math.round(file.size / 1024)} KB)
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-600 mb-2">Kéo thả file vào đây hoặc</p>
                        <label
                          htmlFor={`file-input-${card.type}`}
                          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors duration-200"
                        >
                          Chọn file CSV
                        </label>
                        <p className="text-xs text-gray-500 mt-2">Chỉ chấp nhận file .csv</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handleDownloadTemplate(card.type)}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Tải Template
                    </button>
                    
                    {files && files.length > 0 && (
                      <button
                        onClick={() => handleClearFiles(card.type)}
                        disabled={loading}
                        className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Xóa
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleImport(card.type)}
                      disabled={loading || !files || files.length === 0}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Đang import...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                          </svg>
                          Import
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Instructions */}
        <div className="mt-12 bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="text-2xl mr-2">📋</span>
            Hướng dẫn sử dụng
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">1. Tải Template</h4>
              <p>Nhấn "Tải Template" để tải xuống file mẫu CSV cho từng loại dữ liệu.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2">2. Chuẩn bị dữ liệu</h4>
              <p>Điền dữ liệu vào file template theo đúng định dạng và lưu dưới dạng CSV.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2">3. Import dữ liệu</h4>
              <p>Chọn file CSV đã chuẩn bị và nhấn "Import" để tải dữ liệu lên hệ thống.</p>
            </div>
          </div>
        </div>
      </main>
      
      <FooterAdCpn />
    </div>
  );
};

export default DataImportPage;