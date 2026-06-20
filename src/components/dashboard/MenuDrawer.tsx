import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Search, ShoppingCart, Send, ArrowLeft } from 'lucide-react';
import { DietIndicator } from '@/components/ui/diet-indicator';

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  menuItems: any[];
  tableId: string | null;
  onPlaceOrder: (items: any[]) => void;
}

export function MenuDrawer({ isOpen, onClose, onBack, menuItems, tableId, onPlaceOrder }: MenuDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<{menuItemId: string, quantity: number, specialInstructions: string}[]>([]);
  const [activeTab, setActiveTab] = useState<'menu' | 'cart'>('menu');

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab('menu');
    }
  }, [isOpen]);

  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set(menuItems.map(item => item.category)))];
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      if (!item.available) return false;
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  const handleAddItem = (menuItem: any) => {
    const existing = cart.find(item => item.menuItemId === menuItem.id);
    if (existing) {
      setCart(cart.map(item => 
        item.menuItemId === menuItem.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { menuItemId: menuItem.id, quantity: 1, specialInstructions: '' }]);
    }
  };

  const handleRemoveItem = (menuItemId: string) => {
    const existing = cart.find(item => item.menuItemId === menuItemId);
    if (existing && existing.quantity > 1) {
      setCart(cart.map(item => 
        item.menuItemId === menuItemId ? { ...item, quantity: item.quantity - 1 } : item
      ));
    } else {
      setCart(cart.filter(item => item.menuItemId !== menuItemId));
    }
  };

  const getMenuItemPrice = (id: string) => {
    const item = menuItems.find(m => m.id === id);
    return item ? item.price : 0;
  };

  const getMenuItemName = (id: string) => {
    const item = menuItems.find(m => m.id === id);
    return item ? item.name : 'Unknown';
  };

  const getMenuItemDietType = (id: string) => {
    const item = menuItems.find(m => m.id === id);
    return item?.dietType || 'VEG';
  };

  const totalAmount = cart.reduce((sum, item) => sum + (getMenuItemPrice(item.menuItemId) * item.quantity), 0);

  const handleSubmit = () => {
    if (cart.length > 0) {
      onPlaceOrder(cart);
      setCart([]);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[150] backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div 
        className="fixed inset-x-0 bottom-0 top-0 md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 bg-background border-t md:border border-border shadow-2xl md:rounded-3xl z-[160] overflow-hidden animate-fade-in flex flex-col md:flex-row w-full h-full md:w-[95vw] md:max-w-[1152px] md:h-[85vh]"
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
                    >
                      {/* Clickable Area to Add Item */}
                      <div 
                        className="cursor-pointer flex-1"
                        onClick={() => handleAddItem(item)}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <DietIndicator dietType={item.dietType} />
                          <span className="block font-bold text-foreground group-hover:text-primary leading-tight transition-colors">{item.name}</span>
                          {/* Debug: show dietType value */}
                          {process.env.NODE_ENV === 'development' && (
                            <span className="text-[8px] text-muted-foreground">({item.dietType})</span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground mt-1 block">{item.category}</span>
                        <span className="block font-black text-primary mt-3">
                          ₹{item.price.toFixed(2)}
                        </span>
                      </div>

                      {/* Direct Quantity Adjuster on the Card */}
                      {quantity > 0 && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 bg-background border border-border p-0.5 rounded-lg shadow-sm" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => handleRemoveItem(item.id)} 
                            className="w-5 h-5 flex items-center justify-center rounded bg-muted hover:bg-muted/80 text-foreground font-black text-xs transition-colors"
                          >
                            -
                          </button>
                          <span className="w-4 text-center font-black text-xs text-foreground">{quantity}</span>
                          <button 
                            onClick={() => handleAddItem(item)} 
                            className="w-5 h-5 flex items-center justify-center rounded bg-primary/10 hover:bg-primary/20 text-primary font-black text-xs transition-colors"
                          >
                            +
                          </button>
                        </div>
                      )}
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
                      <p className="font-bold text-foreground truncate">{getMenuItemName(item.menuItemId)}</p>
                    </div>
                    <p className="font-semibold whitespace-nowrap">₹{(getMenuItemPrice(item.menuItemId) * item.quantity).toFixed(2)}</p>
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
                      <button onClick={() => handleRemoveItem(item.menuItemId)} className="w-6 h-6 flex items-center justify-center rounded bg-muted hover:bg-muted/80 font-bold">-</button>
                      <span className="w-4 text-center font-bold text-sm">{item.quantity}</span>
                      <button onClick={() => handleAddItem({id: item.menuItemId})} className="w-6 h-6 flex items-center justify-center rounded bg-primary/10 text-primary hover:bg-primary/20 font-bold">+</button>
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
            <Button 
              className="w-full h-14 text-lg font-bold shadow-md shadow-orange-500/20 bg-orange-500 hover:bg-orange-600"
              disabled={cart.length === 0}
              onClick={handleSubmit}
            >
              <Send className="w-5 h-5 mr-2" /> Send to Kitchen
            </Button>
          </div>
        </div>

      </div>
    </>
  );
}
