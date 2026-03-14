'use client';

import { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff, Settings, Trash2, RotateCcw, Monitor, Smartphone, Palette, Type, Layout } from 'lucide-react';
import { BLOCK_DEFINITIONS, DEFAULT_STYLES, DEFAULT_CONTENT, DEFAULT_BLOCK_ORDER } from '@/lib/funnel/blocks';

// Types
interface Block {
  id: string;
  type: string;
  order: number;
  visible: boolean;
  props: Record<string, unknown>;
}

interface CheckoutConfig {
  blocks: Block[];
  styles: Record<string, string>;
  content: Record<string, string>;
}

// Sortable Block Item
function SortableBlock({ 
  block, 
  definition, 
  onToggle, 
  onRemove, 
  isSelected,
  onSelect 
}: { 
  block: Block; 
  definition: typeof BLOCK_DEFINITIONS[0];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isRequired = definition?.isRequired;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
        isDragging ? 'shadow-lg border-blue-300 bg-blue-50' :
        isSelected ? 'border-blue-500 bg-blue-50' :
        'border-gray-200 hover:border-gray-300 bg-white'
      }`}
      onClick={() => onSelect(block.id)}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className={`p-1 rounded ${isRequired ? 'cursor-not-allowed opacity-30' : 'cursor-grab hover:bg-gray-100'}`}
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>

      {/* Block Icon */}
      <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
        <span className="text-xs font-medium text-gray-600">
          {definition?.name.charAt(0) || '?'}
        </span>
      </div>

      {/* Block Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{definition?.name}</span>
          {isRequired && (
            <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded">Required</span>
          )}
        </div>
        <p className="text-sm text-gray-500 truncate">{definition?.description}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(block.id); }}
          className="p-1.5 hover:bg-gray-100 rounded"
          title={block.visible ? 'Hide' : 'Show'}
        >
          {block.visible ? (
            <Eye className="w-4 h-4 text-gray-600" />
          ) : (
            <EyeOff className="w-4 h-4 text-gray-400" />
          )}
        </button>
        {!isRequired && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(block.id); }}
            className="p-1.5 hover:bg-red-100 rounded text-red-600"
            title="Remove"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// Preview Block Renderer
function PreviewBlock({ block, styles, content }: { block: Block; styles: Record<string, string>; content: Record<string, string> }) {
  const definition = BLOCK_DEFINITIONS.find(b => b.type === block.type);

  if (!block.visible) return null;

  const baseStyle = {
    backgroundColor: styles.cardBackgroundColor,
    borderRadius: styles.cardRadius,
    fontFamily: styles.fontFamily,
  };

  switch (block.type) {
    case 'logo':
      return (
        <div 
          className="p-4 flex items-center justify-center border-b" 
          style={{ ...baseStyle, borderColor: styles.borderColor }}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md flex items-center justify-center"
                 style={{ backgroundColor: styles.primaryColor }}>
              <span className="text-white font-bold text-lg">
                {(content.logoText || 'P').charAt(0)}
              </span>
            </div>
            <span className="font-semibold" style={{ color: styles.textColor }}>
              {content.logoText || 'PayLoop'}
            </span>
          </div>
        </div>
      );

    case 'hero':
      return (
        <div className="p-6 text-center" style={baseStyle}>
          <h1 className="text-xl font-bold mb-2" style={{ color: styles.textColor }}>
            {content.title || 'Complete Your Order'}
          </h1>
          <p style={{ color: styles.textSecondaryColor }}>
            {content.subtitle || 'Secure checkout powered by PayLoop'}
          </p>
        </div>
      );

    case 'order-summary':
      return (
        <div 
          className="p-4 border" 
          style={{ ...baseStyle, borderColor: styles.borderColor }}
        >
          <h3 className="font-semibold mb-3" style={{ color: styles.textColor }}>
            Order Summary
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span style={{ color: styles.textSecondaryColor }}>Product × 1</span>
              <span style={{ color: styles.textColor }}>$29.00</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: styles.textSecondaryColor }}>Shipping</span>
              <span style={{ color: styles.textColor }}>$5.00</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold"
                 style={{ borderColor: styles.borderColor, color: styles.textColor }}>
              <span>Total</span>
              <span>$34.00</span>
            </div>
          </div>
        </div>
      );

    case 'coupon':
      return (
        <div 
          className="p-4 border"
          style={{ ...baseStyle, borderColor: styles.borderColor }}
        >
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Discount code"
              className="flex-1 px-3 py-2 border rounded-lg text-sm"
              style={{ borderColor: styles.borderColor }}
            />
            <button
              className="px-4 py-2 rounded-lg text-white text-sm font-medium"
              style={{ backgroundColor: styles.primaryColor }}
            >
              Apply
            </button>
          </div>
        </div>
      );

    case 'payment-form':
      return (
        <div 
          className="p-4 border"
          style={{ ...baseStyle, borderColor: styles.borderColor }}
        >
          <h3 className="font-semibold mb-4" style={{ color: styles.textColor }}>
            Payment
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Card number"
              className="w-full px-3 py-2.5 border rounded-lg text-sm"
              style={{ borderColor: styles.borderColor }}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="MM/YY"
                className="px-3 py-2.5 border rounded-lg text-sm"
                style={{ borderColor: styles.borderColor }}
              />
              <input
                type="text"
                placeholder="CVC"
                className="px-3 py-2.5 border rounded-lg text-sm"
                style={{ borderColor: styles.borderColor }}
              />
            </div>
            <button
              className="w-full py-3 rounded-lg text-white font-semibold"
              style={{ backgroundColor: styles.primaryColor, borderRadius: styles.buttonRadius }}
            >
              Pay $34.00
            </button>
          </div>
          <p className="text-xs text-center mt-3" style={{ color: styles.textSecondaryColor }}>
            🔒 Secured by 256-bit SSL encryption
          </p>
        </div>
      );

    case 'trust-badges':
      return (
        <div 
          className="p-4 flex justify-center gap-4"
          style={{ backgroundColor: 'transparent' }}
        >
          {['Visa', 'MC', 'Amex', 'SSL'].map((badge) => (
            <div key={badge} className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center">
              <span className="text-xs text-gray-500">{badge}</span>
            </div>
          ))}
        </div>
      );

    case 'footer':
      return (
        <div className="p-4 text-center text-sm" style={{ color: styles.textSecondaryColor }}>
          {content.footerText || '© 2026 Your Store'}
        </div>
      );

    case 'subscription-products':
      return (
        <div 
          className="p-4 border"
          style={{ ...baseStyle, borderColor: styles.borderColor }}
        >
          <h3 className="font-semibold mb-3" style={{ color: styles.textColor }}>
            Add to Your Order
          </h3>
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-sm">Product Insurance</p>
                <p className="text-xs text-gray-500">Monthly protection</p>
              </div>
              <span className="font-semibold">$9/mo</span>
            </div>
          </div>
        </div>
      );

    default:
      return (
        <div 
          className="p-4 border-2 border-dashed"
          style={{ ...baseStyle, borderColor: styles.borderColor }}
        >
          <p className="text-center text-gray-400">Unknown block: {block.type}</p>
        </div>
      );
  }
}

export default function CheckoutEditorPage({ params }: { params: { id: string } }) {
  const [config, setConfig] = useState<CheckoutConfig>({
    blocks: DEFAULT_BLOCK_ORDER.map((type, idx) => ({
      id: `block-${idx}`,
      type,
      order: idx,
      visible: true,
      props: BLOCK_DEFINITIONS.find(b => b.type === type)?.defaultProps || {},
    })),
    styles: DEFAULT_STYLES,
    content: DEFAULT_CONTENT,
  });
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState<'blocks' | 'styles' | 'content'>('blocks');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load config from API
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch(`/api/funnels/${params.id}/checkout`);
        if (response.ok) {
          const data = await response.json();
          if (data.blocks && data.blocks.length > 0) {
            setConfig({
              blocks: data.blocks,
              styles: data.styles || DEFAULT_STYLES,
              content: data.content || DEFAULT_CONTENT,
            });
          }
        }
      } catch (error) {
        console.error('Failed to load config:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadConfig();
  }, [params.id]);

  // Drag end handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setConfig((prev) => {
        const oldIndex = prev.blocks.findIndex((b) => b.id === active.id);
        const newIndex = prev.blocks.findIndex((b) => b.id === over.id);
        const newBlocks = arrayMove(prev.blocks, oldIndex, newIndex).map((b, idx) => ({
          ...b,
          order: idx,
        }));
        return { ...prev, blocks: newBlocks };
      });
    }
  };

  // Toggle block visibility
  const toggleBlock = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) =>
        b.id === id ? { ...b, visible: !b.visible } : b
      ),
    }));
  };

  // Remove block
  const removeBlock = (id: string) => {
    const block = config.blocks.find((b) => b.id === id);
    const definition = BLOCK_DEFINITIONS.find((b) => b.type === block?.type);
    if (definition?.isRequired) return;

    setConfig((prev) => ({
      ...prev,
      blocks: prev.blocks.filter((b) => b.id !== id),
    }));
    if (selectedBlock === id) setSelectedBlock(null);
  };

  // Add block
  const addBlock = (type: string) => {
    const definition = BLOCK_DEFINITIONS.find((b) => b.type === type);
    if (!definition) return;

    const newBlock: Block = {
      id: `block-${Date.now()}`,
      type,
      order: config.blocks.length,
      visible: true,
      props: definition.defaultProps,
    };

    setConfig((prev) => ({
      ...prev,
      blocks: [...prev.blocks, newBlock],
    }));
  };

  // Update style
  const updateStyle = (key: string, value: string) => {
    setConfig((prev) => ({
      ...prev,
      styles: { ...prev.styles, [key]: value },
    }));
  };

  // Update content
  const updateContent = (key: string, value: string) => {
    setConfig((prev) => ({
      ...prev,
      content: { ...prev.content, [key]: value },
    }));
  };

  // Save configuration
  const saveConfig = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/funnels/${params.id}/checkout`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blocks: config.blocks,
          styles: config.styles,
          content: config.content,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      alert('Configuration saved!');
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {isLoading && (
        <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading checkout editor...</p>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Checkout Editor</h1>
            <p className="text-sm text-gray-500">Drag and drop to customize your checkout</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setPreviewMode('desktop')}
                className={`p-2 rounded ${previewMode === 'desktop' ? 'bg-white shadow' : ''}`}
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewMode('mobile')}
                className={`p-2 rounded ${previewMode === 'mobile' ? 'bg-white shadow' : ''}`}
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={saveConfig}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex">
        {/* Left Sidebar - Block List */}
        <div className="w-80 bg-white border-r min-h-[calc(100vh-73px)] overflow-y-auto">
          {/* Tabs */}
          <div className="flex border-b">
            {(['blocks', 'styles', 'content'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-4 py-3 text-sm font-medium capitalize ${
                  activeTab === tab
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-4">
            {activeTab === 'blocks' && (
              <>
                {/* Available Blocks to Add */}
                <div className="mb-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                    Add Block
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {BLOCK_DEFINITIONS.filter((b) => !config.blocks.find((cb) => cb.type === b.type)).map((def) => (
                      <button
                        key={def.type}
                        onClick={() => addBlock(def.type)}
                        className="p-2 text-xs bg-gray-50 hover:bg-gray-100 rounded-lg border text-left"
                      >
                        {def.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Draggable Block List */}
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  Active Blocks
                </h3>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={config.blocks.map((b) => b.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {config.blocks
                        .sort((a, b) => a.order - b.order)
                        .map((block) => (
                          <SortableBlock
                            key={block.id}
                            block={block}
                            definition={BLOCK_DEFINITIONS.find((b) => b.type === block.type)!}
                            onToggle={toggleBlock}
                            onRemove={removeBlock}
                            isSelected={selectedBlock === block.id}
                            onSelect={setSelectedBlock}
                          />
                        ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </>
            )}

            {activeTab === 'styles' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.styles.primaryColor}
                      onChange={(e) => updateStyle('primaryColor', e.target.value)}
                      className="w-10 h-10 rounded border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={config.styles.primaryColor}
                      onChange={(e) => updateStyle('primaryColor', e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Button Radius
                  </label>
                  <select
                    value={config.styles.buttonRadius}
                    onChange={(e) => updateStyle('buttonRadius', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="0px">Sharp (0px)</option>
                    <option value="4px">Small (4px)</option>
                    <option value="8px">Medium (8px)</option>
                    <option value="12px">Large (12px)</option>
                    <option value="9999px">Pill</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Font Family
                  </label>
                  <select
                    value={config.styles.fontFamily}
                    onChange={(e) => updateStyle('fontFamily', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value='-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'>
                      System Default
                    </option>
                    <option value="Inter, sans-serif">Inter</option>
                    <option value='"Helvetica Neue", Arial, sans-serif'>Helvetica</option>
                    <option value="Georgia, serif">Georgia</option>
                  </select>
                </div>

                {/* Reset Button */}
                <button
                  onClick={() => setConfig(prev => ({ ...prev, styles: DEFAULT_STYLES }))}
                  className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset to Defaults
                </button>
              </div>
            )}

            {activeTab === 'content' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logo Text
                  </label>
                  <input
                    type="text"
                    value={config.content.logoText || ''}
                    onChange={(e) => updateContent('logoText', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="PayLoop"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Page Title
                  </label>
                  <input
                    type="text"
                    value={config.content.title || ''}
                    onChange={(e) => updateContent('title', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="Complete Your Order"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    value={config.content.subtitle || ''}
                    onChange={(e) => updateContent('subtitle', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="Secure checkout powered by PayLoop"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Footer Text
                  </label>
                  <input
                    type="text"
                    value={config.content.footerText || ''}
                    onChange={(e) => updateContent('footerText', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="© 2026 Your Store"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right - Preview */}
        <div className="flex-1 p-8 bg-gray-100">
          <div
            className={`mx-auto bg-white rounded-xl shadow-lg overflow-hidden ${
              previewMode === 'mobile' ? 'max-w-[375px]' : 'max-w-[480px]'
            }`}
          >
            {/* Render Preview */}
            <div className="min-h-[600px]">
              {config.blocks
                .sort((a, b) => a.order - b.order)
                .filter((b) => b.visible)
                .map((block) => (
                  <PreviewBlock
                    key={block.id}
                    block={block}
                    styles={config.styles}
                    content={config.content}
                  />
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}