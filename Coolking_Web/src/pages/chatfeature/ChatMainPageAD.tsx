import React, { useState, useCallback, useRef } from 'react';
import HeaderAdCpn from '../../components/admin/HeaderAdCpn';
import ChatListCpn from '../../components/shared/chatfeaturecpn/ChatListCpn';
import ChatInfoCpn from '../../components/shared/chatfeaturecpn/ChatInfoCpn';
import MessageConversationCpn from '../../components/shared/chatfeaturecpn/MessageConversationCpn';
import ImagesCollectionModal from './ImagesCollectionModal';
import FilesCollectionModal from './FilesCollectionModal';
import LinksCollectionModal from './LinksCollectionModal';
import SearchResultModal from './SearchResultModal';
import type { ChatMember } from '../../hooks/useChat';

const ChatMainPageAD: React.FC = () => {
    const chatListRef = useRef<any>(null);
    const [selectedChatId, setSelectedChatId] = useState<string | undefined>();
    const [showImagesModal, setShowImagesModal] = useState(false);
    const [showFilesModal, setShowFilesModal] = useState(false);
    const [showLinksModal, setShowLinksModal] = useState(false);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [chatMembers, setChatMembers] = useState<ChatMember[]>([]);
    const [searchMembers, setSearchMembers] = useState<ChatMember[]>([]);

    const handleChatSelect = (chatId: string) => {
        setSelectedChatId(chatId);
    };

    const handleLastMessageUpdate = (chatId: string, lastMessage: any) => {
        // Call ChatList update method via ref
        if (chatListRef.current?.updateChatLastMessage) {
            chatListRef.current.updateChatLastMessage(chatId, lastMessage);
        }
    };

    const handleShowImages = () => {
        setShowImagesModal(true);
    };

    const handleShowFiles = () => {
        setShowFilesModal(true);
    };

    const handleShowLinks = () => {
        setShowLinksModal(true);
    };

    const handleShowSearchResults = useCallback((results: any[], members: ChatMember[], keyword: string = '') => {
        setSearchResults(results);
        setSearchMembers(members);
        setSearchKeyword(keyword);
        setShowSearchModal(true);
    }, []);

    const handleCloseSearchModal = useCallback(() => {
        setShowSearchModal(false);
        setSearchResults([]);
        setSearchKeyword('');
        setSearchMembers([]);
    }, [showSearchModal]);

    const handleChatMembersUpdate = (members: ChatMember[]) => {
        setChatMembers(members);
    };

    return (
        <div className="h-screen bg-gray-50 flex flex-col">
            <HeaderAdCpn />
            
            {/* Main Chat Interface */}
            <div className="flex-1 flex overflow-hidden">
                {/* Chat List - Left Panel */}
                <div className="w-80 flex-shrink-0">
                    <ChatListCpn 
                        ref={chatListRef}
                        onChatSelect={handleChatSelect}
                        selectedChatId={selectedChatId}
                        onLastMessageUpdate={handleLastMessageUpdate}
                    />
                </div>

                {/* Message Conversation - Center Panel */}
                <div className="flex-1 flex flex-col">
                    <MessageConversationCpn
                        selectedChatId={selectedChatId}
                        onShowSearchResults={(results, members) => handleShowSearchResults(results, members, 'search')}
                        members={chatMembers}
                        onLastMessageUpdate={handleLastMessageUpdate}
                    />
                </div>

                {/* Chat Info - Right Panel */}
                <div className="w-80 flex-shrink-0 border-l border-gray-200">
                    <ChatInfoCpn
                        selectedChatId={selectedChatId}
                        onShowImages={handleShowImages}
                        onShowFiles={handleShowFiles}
                        onShowLinks={handleShowLinks}
                        onMembersUpdate={handleChatMembersUpdate}
                    />
                </div>
            </div>

            {/* Modals */}
            {selectedChatId && (
                <>
                    <ImagesCollectionModal
                        isOpen={showImagesModal}
                        onClose={() => setShowImagesModal(false)}
                        chatId={selectedChatId}
                    />
                    
                    <FilesCollectionModal
                        isOpen={showFilesModal}
                        onClose={() => setShowFilesModal(false)}
                        chatId={selectedChatId}
                    />
                    
                    <LinksCollectionModal
                        isOpen={showLinksModal}
                        onClose={() => setShowLinksModal(false)}
                        chatId={selectedChatId}
                    />
                </>
            )}

            {showSearchModal && (
                <SearchResultModal
                    key={showSearchModal ? 'open' : 'closed'}
                    isOpen={showSearchModal}
                    onClose={handleCloseSearchModal}
                    searchResults={searchResults}
                    searchKeyword={searchKeyword}
                    members={searchMembers}
                />
            )}

            {/* <FooterLeCpn /> */}
        </div>
    );
};

export default ChatMainPageAD;
