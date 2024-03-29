import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { ChangeEvent, FormEvent, useState } from 'react'
import { toast } from 'sonner'

interface NewNoteCardProps {
  onNoteCreated: (content: string) => void
}

let speechRecognition: SpeechRecognition | null = null

export function NewNoteCard({ onNoteCreated }: NewNoteCardProps) {
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [content, setContent] = useState('')

  function handleStartEditor() {
    setShouldShowOnboarding(false)
  }

  function handleContentChanged(event: ChangeEvent<HTMLTextAreaElement>) {
    setContent(event.target.value)

    if (event.target.value === '') {
      setShouldShowOnboarding(true)
    }
  }

  function handleSaveNote(event: FormEvent) {
    event.preventDefault()

    if (content === '') {
      return
    }

    const notesStorage = localStorage.getItem('notes')

    if (notesStorage) {
      const notesArray = JSON.parse(notesStorage)

      if (notesArray && notesArray.length >= 5) {
        event.preventDefault()
        toast.warning('Limite de 5 notas de teste alcançado! Para continuar testando, apague uma nota existente.')
      } else {
        onNoteCreated(content)

        setContent('')
        setShouldShowOnboarding(true)

        toast.success('Nota criada com sucesso!')
      }
    } else {
      onNoteCreated(content)

      setContent('')
      setShouldShowOnboarding(true)

      toast.success('Nota criada com sucesso!')
    }
  }

  function handleModalOpenChange(open: boolean) {
    if (!open) {
      setContent('');
      setShouldShowOnboarding(true)
    }
  }

  function handleStartRecording() {
    const isSpeechRecognitionAPIAvailable = 'SpeechRecognition' in window
      || 'webkitSpeechRecognition' in window

    if (!isSpeechRecognitionAPIAvailable) {
      toast.error('Seu navegador não suporta a transcrição de áudio (use o Chrome mais atual).')
      return
    }

    setIsRecording(true)
    setShouldShowOnboarding(false)

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition

    speechRecognition = new SpeechRecognitionAPI()

    speechRecognition.lang = 'pt-BR'
    speechRecognition.continuous = true
    speechRecognition.maxAlternatives = 1
    speechRecognition.interimResults = true

    speechRecognition.onresult = (event) => {
      const transcription = Array.from(event.results).reduce((text, result) => {
        return text.concat(result[0].transcript)
      }, '')

      setContent(transcription)
    }

    // speechRecognition.onerror = (event) => {
    //   console.error(event)
    // }

    speechRecognition.start()
  }

  function handleStopRecording() {
    setIsRecording(false)

    if (speechRecognition !== null) {
      speechRecognition.stop()
    }
    if (content === '') {
      setShouldShowOnboarding(true)
    }
  }

  function handleDialogTrigger(event: React.MouseEvent<HTMLButtonElement>) {
    const notesStorage = localStorage.getItem('notes')

    if (notesStorage) {
      const notesArray = JSON.parse(notesStorage)

      if (notesArray && notesArray.length >= 5) {
        event.preventDefault()
        toast.warning('Limite de 5 notas de teste alcançado! Para continuar testando, apague uma nota existente.')
      }
    }
  }

  return (
    <Dialog.Root onOpenChange={handleModalOpenChange}>
      <Dialog.Trigger
        className='rounded-md flex flex-col bg-slate-700 text-left p-5 gap-y-3 outline-none hover:ring-2 hover:ring-slate-600 focus-visible:ring-2 focus-visible:ring-lime-400'
        onClick={handleDialogTrigger}
      >
        <span className='text-sm font-medium text-slate-200'>
          Adicionar nota
        </span>
        <p className='text-sm leading-6 text-slate-400'>
          Grave uma nota em áudio que será convertida para texto automaticamente.
        </p>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className='inset-0 fixed bg-black/50' />
        <Dialog.Content
          onPointerDownOutside={(event) => { isRecording ? event.preventDefault() : null }}
          onEscapeKeyDown={(event) => { isRecording ? event.preventDefault() : null }}
          className='fixed overflow-hidden left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[640px] md:w-full w-3/4 h-[75vh] bg-slate-700 rounded-md flex flex-col outline-none'
        >
          <Dialog.Close disabled={isRecording} className={`absolute right-0 top-0 bg-slate-800 p-1.5 text-slate-400 ${!isRecording ? 'hover:text-slate-100' : null} `}>
            <X className='size-5 ' />
          </Dialog.Close>

          <form className='flex-1 flex flex-col'>
            <div className='flex flex-1 flex-col gap-3 p-5'>
              <span className='text-sm font-medium text-slate-300'>
                Adicionar nota
              </span>

              {shouldShowOnboarding ? (
                <div className='flex flex-col gap-3'>
                  <button
                    type='button'
                    onClick={handleStartRecording}
                    className='font-medium text-slate-50 hover:underline bg-slate-800 p-2 rounded-md'
                  >
                    Gravar uma nota
                  </button>
                  <button
                    type='button'
                    onClick={handleStartEditor}
                    className='font-medium text-slate-50 hover:underline bg-slate-800 p-2 rounded-md'
                  >
                    Usar apenas texto
                  </button>
                </div>
              ) : (
                <textarea
                  autoFocus
                  className='text-sm leading-6 text-slate-400 bg-transparent resize-none flex-1 outline-none'
                  onChange={handleContentChanged}
                  value={content}
                />
              )}

            </div>

            {isRecording ? (
              <button
                type='button'
                onClick={handleStopRecording}
                className='w-full flex items-center justify-center gap-2 bg-slate-900 py-4 text-center text-sm text-slate-300 outline-none font-medium hover:text-slate-100'
              >
                <div className='size-3 rounded-full bg-red-500 animate-pulse' />
                Gravando! (clique para interromper)
              </button>
            ) : (
              <button
                type='button'
                onClick={handleSaveNote}
                className='w-full bg-lime-400 py-4 text-center text-sm text-lime-950 outline-none font-medium hover:bg-lime-500'
              >
                Salvar nota
              </button>
            )}
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root >

  )
}