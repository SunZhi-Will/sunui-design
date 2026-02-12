import type { Meta, StoryObj } from '@storybook/react';

const ColorTest = () => {
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Tailwind 4.0 顏色系統測試</h1>
      
      {/* Primary Colors */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Primary 主色系</h2>
        <div className="flex gap-2 flex-wrap">
          <div className="w-20 h-20 bg-primary-50 rounded flex items-center justify-center text-xs">50</div>
          <div className="w-20 h-20 bg-primary-100 rounded flex items-center justify-center text-xs">100</div>
          <div className="w-20 h-20 bg-primary-200 rounded flex items-center justify-center text-xs">200</div>
          <div className="w-20 h-20 bg-primary-300 rounded flex items-center justify-center text-xs">300</div>
          <div className="w-20 h-20 bg-primary-400 rounded flex items-center justify-center text-xs text-white">400</div>
          <div className="w-20 h-20 bg-primary-500 rounded flex items-center justify-center text-xs text-white">500</div>
          <div className="w-20 h-20 bg-primary-600 rounded flex items-center justify-center text-xs text-white">600</div>
          <div className="w-20 h-20 bg-primary-700 rounded flex items-center justify-center text-xs text-white">700</div>
          <div className="w-20 h-20 bg-primary-800 rounded flex items-center justify-center text-xs text-white">800</div>
          <div className="w-20 h-20 bg-primary-900 rounded flex items-center justify-center text-xs text-white">900</div>
          <div className="w-20 h-20 bg-primary-950 rounded flex items-center justify-center text-xs text-white">950</div>
        </div>
      </section>

      {/* Semantic Colors */}
      <section>
        <h2 className="text-xl font-semibold mb-3">語義顏色</h2>
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="w-32 h-16 bg-success-light rounded flex items-center justify-center text-sm">Success Light</div>
            <div className="w-32 h-16 bg-success rounded flex items-center justify-center text-sm text-white">Success</div>
            <div className="w-32 h-16 bg-success-dark rounded flex items-center justify-center text-sm text-white">Success Dark</div>
          </div>
          <div className="flex gap-2">
            <div className="w-32 h-16 bg-warning-light rounded flex items-center justify-center text-sm">Warning Light</div>
            <div className="w-32 h-16 bg-warning rounded flex items-center justify-center text-sm text-white">Warning</div>
            <div className="w-32 h-16 bg-warning-dark rounded flex items-center justify-center text-sm text-white">Warning Dark</div>
          </div>
          <div className="flex gap-2">
            <div className="w-32 h-16 bg-danger-light rounded flex items-center justify-center text-sm">Danger Light</div>
            <div className="w-32 h-16 bg-danger rounded flex items-center justify-center text-sm text-white">Danger</div>
            <div className="w-32 h-16 bg-danger-dark rounded flex items-center justify-center text-sm text-white">Danger Dark</div>
          </div>
          <div className="flex gap-2">
            <div className="w-32 h-16 bg-info-light rounded flex items-center justify-center text-sm">Info Light</div>
            <div className="w-32 h-16 bg-info rounded flex items-center justify-center text-sm text-white">Info</div>
            <div className="w-32 h-16 bg-info-dark rounded flex items-center justify-center text-sm text-white">Info Dark</div>
          </div>
        </div>
      </section>

      {/* Interactive Examples */}
      <section>
        <h2 className="text-xl font-semibold mb-3">互動範例</h2>
        <div className="space-y-3">
          <button className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600 transition">
            Primary Button
          </button>
          <button className="px-4 py-2 bg-success text-white rounded hover:bg-success-dark transition ml-2">
            Success Button
          </button>
          <button className="px-4 py-2 bg-danger text-white rounded hover:bg-danger-dark transition ml-2">
            Danger Button
          </button>
        </div>
      </section>

      {/* Text Colors */}
      <section>
        <h2 className="text-xl font-semibold mb-3">文字顏色</h2>
        <p className="text-primary-500 mb-2">Primary text color</p>
        <p className="text-success mb-2">Success text color</p>
        <p className="text-warning mb-2">Warning text color</p>
        <p className="text-danger mb-2">Danger text color</p>
        <p className="text-info mb-2">Info text color</p>
      </section>
    </div>
  );
};

const meta: Meta<typeof ColorTest> = {
  title: 'Test/ColorTest',
  component: ColorTest,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof ColorTest>;

export const Default: Story = {};
