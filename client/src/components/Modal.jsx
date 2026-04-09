import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

export default function Modal({ open, onOpenChange, title, children }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
        <Dialog.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold text-slate-800">{title}</Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
