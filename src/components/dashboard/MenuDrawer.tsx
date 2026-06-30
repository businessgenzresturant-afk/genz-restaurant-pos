import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Search, ShoppingCart, Send, ArrowLeft, Printer, Phone } from 'lucide-react';
import { DietIndicator } from '@/components/ui/diet-indicator';

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  menuItems: any[];
  tableId: string | null;
  onPlaceOrder: (items: any[], action?: 'SAVE' | 'SAVE_PRINT' | 'SAVE_EBILL') => void;
}

export function MenuDrawer({ isOpen, onClose, onBack, menuItems, tableId, onPlaceOrder }: MenuDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<{menuItemId: string, quantity: number, specialInstructions: string, portionType?: 'HALF' | 'FULL'}[]>([]);
  const [activeTab, setActiveTab] = useState<'menu' | 'cart'>('menu');
  const [submitState, setSubmitState] = useState<'IDLE' | 'SAVING' | 'UPDATING_KITCHEN' | 'DONE'>('IDLE');

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab('menu');
      setSubmitState('IDLE'); // Reset on open
      setCart([]); // Clear cart on open to prevent stale or cross-table items
    }
  }, [isOpen]);

  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set(menuItems.map(item => item.category)))];
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    const filtered = menuItems.filter(item => {
      if (!item.available) return false;
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
    
    // DEBUG: Log first 3 items to verify dietType
    if (filtered.length > 0) {
      console.log('[MenuDrawer] First 3 filtered items:', filtered.slice(0, 3).map(item => ({
        name: item.name,
        dietType: item.dietType,
        hasProperty: 'dietType' in item
      })));
    }
    
    return filtered;
  }, [menuItems, selectedCategory, searchQuery]);

  const handleAddItem = (menuItem: any, portionType?: 'HALF' | 'FULL') => {
    const existing = cart.find(item => item.menuItemId === menuItem.id && item.portionType === portionType);
    if (existing) {
      setCart(cart.map(item => 
        (item.menuItemId === menuItem.id && item.portionType === portionType) ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { menuItemId: menuItem.id, quantity: 1, specialInstructions: '', portionType }]);
    }
    setSearchQuery('');
  };

  const handleRemoveItem = (menuItemId: string, portionType?: 'HALF' | 'FULL') => {
    const existing = cart.find(item => item.menuItemId === menuItemId && item.portionType === portionType);
    if (existing && existing.quantity > 1) {
      setCart(cart.map(item => 
        (item.menuItemId === menuItemId && item.portionType === portionType) ? { ...item, quantity: item.quantity - 1 } : item
      ));
    } else {
      setCart(cart.filter(item => !(item.menuItemId === menuItemId && item.portionType === portionType)));
    }
  };

  const getMenuItemPrice = (id: string, portionType?: 'HALF' | 'FULL') => {
    const item = menuItems.find(m => m.id === id);
    if (!item) return 0;
    if (portionType === 'HALF' && item.priceHalf) return item.priceHalf;
    return item.price;
  };

  const getMenuItemName = (id: string) => {
    const item = menuItems.find(m => m.id === id);
    return item ? item.name : 'Unknown';
  };

  const getMenuItemDietType = (id: string) => {
    const item = menuItems.find(m => m.id === id);
    return item?.dietType || 'VEG';
  };

  const totalAmount = cart.reduce((sum, item) => sum + (getMenuItemPrice(item.menuItemId, item.portionType) * item.quantity), 0);

  const handleSubmit = async (action: 'SAVE' | 'SAVE_PRINT' | 'SAVE_EBILL' = 'SAVE') => {
    if (cart.length > 0 && submitState === 'IDLE') {
      setSubmitState('SAVING');
      try {
        // Create an artificial state transition for better UX visibility
        let isComplete = false;
        setTimeout(() => {
          if (!isComplete) setSubmitState('UPDATING_KITCHEN');
        }, 400);

        await onPlaceOrder(cart, action);
        isComplete = true;
        setSubmitState('DONE');
        setCart([]);
        
        setTimeout(() => {
          setSubmitState('IDLE');
          // parent handles close via onPlaceOrder completion
        }, 500);
      } catch (error) {
        console.error('Failed to place order:', error);
        setSubmitState('IDLE');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center md:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      
      <div 
        className="relative bg-background border-t md:border border-border shadow-2xl md:rounded-3xl z-[160] overflow-hidden animate-fade-in flex flex-col md:flex-row w-full h-full md:w-[95vw] md:max-w-[1152px] md:h-[85vh]"
      >
        
        {/* Left Side: Menu Selection */}
        <div className={`flex-1 flex flex-col h-full bg-muted/10 md:border-r border-border min-h-0 min-w-0 ${activeTab === 'menu' ? 'flex' : 'hidden md:flex'}`}>
          <div className="p-4 border-b border-border bg-background grid grid-cols-3 items-center">
            <div className="flex items-center gap-2">
              {onBack && (
                <button 
                  onClick={onBack}
                  className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors mr-1"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <h2 className="text-2xl font-black text-foreground">Menu</h2>
            </div>
            <div className="relative w-full max-w-xs justify-self-center">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search items..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 rounded-full"
              />
            </div>
            <div className="justify-self-end" />
          </div>

          {/* Categories */}
          <div className="flex gap-2 p-4 overflow-x-auto border-b border-border bg-background scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Items Grid */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {filteredItems.length === 0 ? (
              <p className="text-muted-foreground text-center py-10">No items found.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredItems.map(item => {
                  const cartItem = cart.find(i => i.menuItemId === item.id);
                  const quantity = cartItem ? cartItem.quantity : 0;
                  
                  return (
                    <div
                      key={item.id}
                      className={`relative p-4 rounded-xl border transition-all flex flex-col h-full justify-between bg-card group ${
                        quantity > 0 
                          ? 'border-primary bg-primary/[0.02] shadow-md shadow-primary/5' 
                          : 'border-border hover:border-primary/40'
                      }`}
                      onClick={() => {
                        if (!item.hasHalfFullOption) {
                          handleAddItem(item);
                        }
                      }}
                    >
                      {/* Item Details */}
                      <div className="cursor-pointer">
                        <div className="flex items-start gap-2 mb-1">
                          <div className="mt-1">
                            <DietIndicator dietType={item.dietType} />
                          </div>
                          <span className="block font-bold text-base text-foreground group-hover:text-primary leading-tight transition-colors pr-2">
                            {item.name}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-muted-foreground block">{item.category}</span>
                      </div>

                      <div className="mt-auto pt-4 flex flex-col">
                        {item.hasHalfFullOption ? (
                          <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                            {/* Half */}
                            <div className="flex items-center justify-between bg-muted/20 rounded-xl p-2 border border-border">
                              <span className="text-xs font-bold text-muted-foreground ml-1">Half (₹{item.priceHalf?.toFixed(2)})</span>
                              {(() => {
                                const halfItem = cart.find(i => i.menuItemId === item.id && i.portionType === 'HALF');
                                const halfQty = halfItem ? halfItem.quantity : 0;
                                return halfQty > 0 ? (
                                  <div className="flex items-center gap-2">
                                    <button onClick={() => handleRemoveItem(item.id, 'HALF')} className="w-8 h-8 flex items-center justify-center rounded-lg bg-muted hover:bg-muted/80 text-foreground font-black text-sm active:scale-95 transition-all">-</button>
                                    <span className="w-4 text-center font-black text-xs">{halfQty}</span>
                                    <button onClick={() => handleAddItem(item, 'HALF')} className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-black text-sm active:scale-95 transition-all">+</button>
                                  </div>
                                ) : (
                                  <Button size="sm" variant="secondary" className="h-8 px-4 text-xs font-bold rounded-lg active:scale-95 transition-all" onClick={() => handleAddItem(item, 'HALF')}>Add</Button>
                                );
                              })()}
                            </div>
                            {/* Full */}
                            <div className="flex items-center justify-between bg-muted/20 rounded-xl p-2 border border-border">
                              <span className="text-xs font-bold text-muted-foreground ml-1">Full (₹{item.price.toFixed(2)})</span>
                              {(() => {
                                const fullItem = cart.find(i => i.menuItemId === item.id && i.portionType === 'FULL');
                                const fullQty = fullItem ? fullItem.quantity : 0;
                                return fullQty > 0 ? (
                                  <div className="flex items-center gap-2">
                                    <button onClick={() => handleRemoveItem(item.id, 'FULL')} className="w-8 h-8 flex items-center justify-center rounded-lg bg-muted hover:bg-muted/80 text-foreground font-black text-sm active:scale-95 transition-all">-</button>
                                    <span className="w-4 text-center font-black text-xs">{fullQty}</span>
                                    <button onClick={() => handleAddItem(item, 'FULL')} className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-black text-sm active:scale-95 transition-all">+</button>
                                  </div>
                                ) : (
                                  <Button size="sm" variant="secondary" className="h-8 px-4 text-xs font-bold rounded-lg active:scale-95 transition-all" onClick={() => handleAddItem(item, 'FULL')}>Add</Button>
                                );
                              })()}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                            <span className="block font-black text-primary text-lg">
                              ₹{item.price.toFixed(2)}
                            </span>
                            
                            {quantity > 0 ? (
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => handleRemoveItem(item.id)} 
                                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-muted hover:bg-muted/80 text-foreground font-black text-sm active:scale-95 transition-all"
                                >
                                  -
                                </button>
                                <span className="w-4 text-center font-black text-xs text-foreground">{quantity}</span>
                                <button 
                                  onClick={() => handleAddItem(item)} 
                                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-black text-sm active:scale-95 transition-all"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <Button size="sm" variant="secondary" className="h-8 px-4 text-xs font-bold rounded-lg active:scale-95 transition-all" onClick={() => handleAddItem(item)}>
                                Add
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mobile View Cart Footer */}
          {cart.length > 0 && (
            <div className="md:hidden p-4 border-t border-border bg-background flex items-center justify-between gap-4 shrink-0">
              <div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Total Amount</p>
                <p className="text-xl font-black text-primary">₹{totalAmount.toFixed(2)}</p>
              </div>
              <Button 
                onClick={() => setActiveTab('cart')}
                className="bg-primary text-primary-foreground font-bold px-6 py-2 rounded-xl flex items-center gap-2"
              >
                View Cart ({cart.reduce((s, i) => s + i.quantity, 0)}) 🛒
              </Button>
            </div>
          )}
        </div>

        {/* Right Side: Cart */}
        <div 
          className={`flex-shrink-0 flex flex-col h-full bg-background min-h-0 border-l border-border w-full md:w-[350px] md:min-w-[350px] ${activeTab === 'cart' ? 'flex' : 'hidden md:flex'}`}
        >
          <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setActiveTab('menu')}
                className="md:hidden p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors mr-1"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <ShoppingCart className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-black text-foreground">Current Order</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                <ShoppingCart className="w-12 h-12 mb-3 text-muted-foreground" />
                <p className="font-semibold text-muted-foreground">Cart is empty</p>
              </div>
            ) : (
              cart.map((item, index) => (
                <div key={index} className="flex flex-col p-3 bg-muted/30 rounded-xl border border-border">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                      <DietIndicator dietType={getMenuItemDietType(item.menuItemId)} />
                      <p className="font-bold text-foreground truncate">
                        {getMenuItemName(item.menuItemId)}
                        {item.portionType && <span className="ml-2 text-[9px] uppercase bg-primary/20 text-primary px-1.5 py-0.5 rounded font-black">{item.portionType}</span>}
                      </p>
                    </div>
                    <p className="font-semibold whitespace-nowrap">₹{(getMenuItemPrice(item.menuItemId, item.portionType) * item.quantity).toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <Input
                      placeholder="Instructions..."
                      value={item.specialInstructions}
                      onChange={(e) => {
                        const newCart = [...cart];
                        newCart[index].specialInstructions = e.target.value;
                        setCart(newCart);
                      }}
                      className="h-8 text-xs bg-background border-border w-[140px]"
                    />
                    <div className="flex items-center space-x-2 bg-background rounded-lg border border-border p-1 shadow-sm">
                      <button onClick={() => handleRemoveItem(item.menuItemId, item.portionType)} className="w-6 h-6 flex items-center justify-center rounded bg-muted hover:bg-muted/80 font-bold transition-all active:scale-[0.90]">-</button>
                      <span className="w-4 text-center font-bold text-sm">{item.quantity}</span>
                      <button onClick={() => handleAddItem({id: item.menuItemId}, item.portionType)} className="w-6 h-6 flex items-center justify-center rounded bg-primary/10 text-primary hover:bg-primary/20 font-bold transition-all active:scale-[0.90]">+</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-border bg-muted/10 space-y-3">
            <div className="flex justify-between items-end mb-2">
              <span className="font-bold text-muted-foreground">Total</span>
              <span className="font-black text-3xl text-primary">₹{totalAmount.toFixed(2)}</span>
            </div>
            {submitState === 'IDLE' ? (
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  className="w-full h-12 text-xs font-bold shadow-md shadow-blue-500/20 bg-blue-500 hover:bg-blue-600 active:scale-[0.97] transition-transform flex flex-col items-center justify-center px-1"
                  disabled={cart.length === 0}
                  onClick={() => handleSubmit('SAVE')}
                >
                  <Send className="w-4 h-4 mb-0.5" /> Save
                </Button>
                <Button 
                  className="w-full h-12 text-xs font-bold shadow-md shadow-orange-500/20 bg-orange-500 hover:bg-orange-600 active:scale-[0.97] transition-transform flex flex-col items-center justify-center px-1"
                  disabled={cart.length === 0}
                  onClick={() => handleSubmit('SAVE_PRINT')}
                >
                  <Printer className="w-4 h-4 mb-0.5" /> Save & Print
                </Button>
              </div>
            ) : (
              <Button className="w-full h-12 font-bold bg-muted text-muted-foreground" disabled>
                {submitState === 'SAVING' && (
                  <><div className="w-5 h-5 mr-2 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" /> Saving...</>
                )}
                {submitState === 'UPDATING_KITCHEN' && (
                  <><div className="w-5 h-5 mr-2 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" /> Kitchen...</>
                )}
                {submitState === 'DONE' && (
                  <>✅ Done</>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
