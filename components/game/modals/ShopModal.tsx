import React, { useState } from 'react';
import Button from '../../Button';
import { ShoppingBagIcon, XMarkIcon, CurrencyDollarIcon } from '@heroicons/react/24/solid';
import { COMMON_ITEMS, UNCOMMON_ITEMS, getItemValue } from '../../../services/items';

interface ShopModalProps {
  gold: number;
  inventory: string[];
  onBuy: (item: string, cost: number) => void;
  onSell: (item: string, value: number) => void;
  onClose: () => void;
}

const ShopModal: React.FC<ShopModalProps> = ({ gold, inventory, onBuy, onSell, onClose }) => {
  const [tab, setTab] = useState<'BUY' | 'SELL'>('BUY');
  
  // Generate a random stock for this session based on common items
  // In a real app we might persist this in the map object, but for now we generate deterministic stock based on ... randomness
  // actually, let's just use a fixed list of common items + a few random uncommon for "Standardized Shop" feel
  const [shopInventory] = useState(() => {
     const stock = [...COMMON_ITEMS];
     // Add 2 random uncommon
     stock.push(UNCOMMON_ITEMS[Math.floor(Math.random() * UNCOMMON_ITEMS.length)]);
     stock.push(UNCOMMON_ITEMS[Math.floor(Math.random() * UNCOMMON_ITEMS.length)]);
     return Array.from(new Set(stock)).map(name => ({
         name,
         price: getItemValue(name) * 2 // Buy price is higher than base value
     }));
  });

  return (
    <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
        <div className="bg-slate-900 p-6 rounded-xl max-w-lg w-full border border-amber-700 shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-4 shrink-0">
                <h2 className="text-xl font-bold text-amber-500 flex items-center"><ShoppingBagIcon className="h-6 w-6 mr-2"/> Merchant</h2>
                <div className="flex items-center text-amber-300 bg-slate-800 px-3 py-1 rounded-full text-sm">
                    <CurrencyDollarIcon className="h-4 w-4 mr-1"/> {gold}
                </div>
                <button onClick={onClose}><XMarkIcon className="h-6 w-6 text-slate-400 hover:text-white"/></button>
            </div>
            
            <div className="flex gap-2 mb-4 border-b border-slate-700 pb-2">
                <Button variant={tab === 'BUY' ? 'primary' : 'ghost'} onClick={() => setTab('BUY')} className="flex-1 text-sm">Buy</Button>
                <Button variant={tab === 'SELL' ? 'primary' : 'ghost'} onClick={() => setTab('SELL')} className="flex-1 text-sm">Sell</Button>
            </div>

            <div className="overflow-y-auto pr-2 space-y-2">
                {tab === 'BUY' ? (
                    shopInventory.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-slate-800 rounded border border-slate-700">
                            <div>
                                <span className="text-slate-200 font-medium block">{item.name}</span>
                                <span className="text-amber-500 text-xs">{item.price} Gold</span>
                            </div>
                            <Button 
                                onClick={() => onBuy(item.name, item.price)} 
                                disabled={gold < item.price}
                                variant="secondary"
                                className="text-xs px-3 py-1"
                            >
                                Buy
                            </Button>
                        </div>
                    ))
                ) : (
                    inventory.length === 0 ? <p className="text-slate-500 text-center py-4">Nothing to sell.</p> :
                    inventory.map((item, idx) => {
                        const val = getItemValue(item);
                        return (
                            <div key={idx} className="flex justify-between items-center p-3 bg-slate-800 rounded border border-slate-700">
                                <div>
                                    <span className="text-slate-200 font-medium block">{item}</span>
                                    <span className="text-amber-500 text-xs">{val} Gold</span>
                                </div>
                                <Button 
                                    onClick={() => onSell(item, val)} 
                                    variant="secondary"
                                    className="text-xs px-3 py-1"
                                >
                                    Sell
                                </Button>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    </div>
  );
};

export default ShopModal;
