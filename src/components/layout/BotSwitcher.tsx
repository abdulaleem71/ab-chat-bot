import React, { useState, useRef, useMemo } from 'react';
import { Bot, ChevronDown, Plus, Check, Search } from 'lucide-react';
import { Chatbot } from '../../types';
import { useClickOutside } from '../../hooks/useClickOutside';
import { getModelDisplayName } from '../../config/models';

export interface BotSwitcherProps {
  chatbots: Chatbot[];
  selectedBot: Chatbot | null;
  onSelectBot: (bot: Chatbot) => void;
  onCreateNewBot: () => void;
}

export const BotSwitcher: React.FC<BotSwitcherProps> = ({
  chatbots,
  selectedBot,
  onSelectBot,
  onCreateNewBot,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef, () => {
    setIsOpen(false);
    setSearchQuery('');
  });

  const filteredBots = useMemo(() => {
    if (!searchQuery.trim()) return chatbots;
    const q = searchQuery.toLowerCase();
    return chatbots.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        (b.description && b.description.toLowerCase().includes(q))
    );
  }, [chatbots, searchQuery]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        id="bot-switcher-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 transition text-left text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-zinc-900 shadow-2xs cursor-pointer"
        title={selectedBot ? `Current Bot: ${selectedBot.name} (${selectedBot.status})` : 'Select a chatbot'}
      >
        {/* Bot Avatar */}
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 text-white font-medium shadow-2xs"
          style={{ backgroundColor: selectedBot?.primaryColor || '#4F46E5' }}
        >
          {selectedBot?.avatar ? (
            <span className="text-xs leading-none">{selectedBot.avatar}</span>
          ) : (
            <Bot className="w-3.5 h-3.5" />
          )}
        </div>

        {/* Bot Name */}
        <span className="font-bold text-zinc-900 text-xs leading-none truncate max-w-[90px] sm:max-w-[130px] md:max-w-[150px]">
          {selectedBot ? selectedBot.name : 'Select a Chatbot'}
        </span>

        {/* Status Pill */}
        {selectedBot ? (
          selectedBot.status === 'active' ? (
            <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 leading-none shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/80 leading-none shrink-0">
              Draft
            </span>
          )
        ) : (
          <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-500 border border-zinc-200 leading-none shrink-0">
            None
          </span>
        )}

        {/* Dropdown Chevron */}
        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-400 ml-0.5 shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-zinc-800' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          id="bot-switcher-dropdown"
          className="absolute right-0 sm:left-0 sm:right-auto mt-1.5 w-72 rounded-2xl border border-zinc-200 bg-white shadow-xl p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Header & Bot Count */}
          <div className="px-2 py-1.5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider flex items-center justify-between">
            <span>Your Assistants</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-600 font-bold">
              {chatbots.length}
            </span>
          </div>

          {/* Search Filter if multiple bots */}
          {chatbots.length > 3 && (
            <div className="px-1.5 pb-1.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter bots..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-7 pr-2.5 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-zinc-900"
                />
              </div>
            </div>
          )}

          {/* Bot List */}
          <div className="max-h-60 overflow-y-auto space-y-0.5 scrollbar-thin py-0.5">
            {filteredBots.length === 0 ? (
              <div className="py-4 px-2 text-center text-zinc-400 text-xs">
                {searchQuery ? 'No matching bots found' : 'No chatbots available'}
              </div>
            ) : (
              filteredBots.map((bot) => {
                const isSelected = selectedBot?.id === bot.id;
                return (
                  <button
                    key={bot.id}
                    onClick={() => {
                      onSelectBot(bot);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    role="option"
                    aria-selected={isSelected}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-100 text-zinc-950 font-bold'
                        : 'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-xs text-white shrink-0 font-medium shadow-2xs"
                        style={{ backgroundColor: bot.primaryColor || '#4F46E5' }}
                      >
                        {bot.avatar || '🤖'}
                      </div>
                      <div className="min-w-0">
                        <span className="truncate block text-xs leading-tight font-semibold">
                          {bot.name}
                        </span>
                        <span className="text-[10px] text-zinc-400 block font-normal leading-tight">
                          {getModelDisplayName(bot.model)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {bot.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 leading-none">
                          <span className="w-1 h-1 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/80 leading-none">
                          Draft
                        </span>
                      )}
                      {isSelected && <Check className="w-3.5 h-3.5 text-zinc-950 shrink-0 ml-1" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Global "+ New Bot" CTA - Always visible */}
          <div className="border-t border-zinc-100 mt-1.5 pt-1.5">
            <button
              id="topbar-new-bot-cta"
              type="button"
              onClick={() => {
                setIsOpen(false);
                setSearchQuery('');
                onCreateNewBot();
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs transition cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ New Bot</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
