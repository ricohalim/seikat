'use client'

import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { Upload, X, Check, ZoomIn, ZoomOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ProfileImageUploadProps {
    currentUrl: string
    onUploadComplete: (url: string) => void
    bucket?: string
    folder?: string
    cropShape?: 'round' | 'rect'
}

export default function ProfileImageUpload({
    currentUrl,
    onUploadComplete,
    bucket = 'avatars',
    folder = 'avatars',
    cropShape = 'round'
}: ProfileImageUploadProps) {
    const [imageSrc, setImageSrc] = useState<string | null>(null)
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
    const [uploading, setUploading] = useState(false)

    // Helper to read file
    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0]
            const reader = new FileReader()
            reader.addEventListener('load', () => setImageSrc(reader.result?.toString() || null))
            reader.readAsDataURL(file)
        }
    }

    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    const createImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const image = new Image()
            image.addEventListener('load', () => resolve(image))
            image.addEventListener('error', (error) => reject(error))
            image.setAttribute('crossOrigin', 'anonymous')
            image.src = url
        })

    const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<Blob> => {
        const image = await createImage(imageSrc)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) throw new Error('No 2d context')

        canvas.width = pixelCrop.width
        canvas.height = pixelCrop.height

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        )

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob!)
            }, 'image/jpeg')
        })
    }

    const handleSave = async () => {
        if (!imageSrc || !croppedAreaPixels) return
        setUploading(true)

        try {
            const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels)
            const fileExt = 'jpg'
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
            // Use provided folder or default
            const filePath = `${folder}/${fileName}`

            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(filePath, croppedBlob)

            if (error) {
                alert('Gagal upload: ' + error.message)
                throw error
            }

            const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath)

            onUploadComplete(publicUrl)
            setImageSrc(null) // Reset editor
        } catch (e) {
            console.error(e)
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="space-y-4">
            {/* Preview Current or Default */}
            {!imageSrc && (
                <div className="flex items-center gap-4">
                    <div className={`w-20 h-20 ${cropShape === 'round' ? 'rounded-full' : 'rounded-lg'} bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative group`}>
                        {currentUrl ? (
                            <img src={currentUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-gray-400 text-xs text-center">No Photo</div>
                        )}
                        <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                            <Upload size={20} className="text-white" />
                            <input type="file" className="hidden" accept="image/*" onChange={onFileChange} />
                        </label>
                    </div>
                    <div className="flex-1">
                        <h4 className="text-sm font-bold text-navy">Foto Profil</h4>
                        <p className="text-xs text-gray-500 mb-2">Format JPG/PNG, Max 2MB.</p>
                        <label className="inline-flex items-center gap-2 cursor-pointer bg-white border border-gray-200 px-3 py-1.5 rounded-full text-xs font-bold text-navy hover:bg-gray-50 transition shadow-sm">
                            <Upload size={14} /> Upload Baru
                            <input type="file" className="hidden" accept="image/*" onChange={onFileChange} />
                        </label>
                    </div>
                </div>
            )}

            {/* Cropper Modal / Area */}
            {imageSrc && (
                <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-navy">Sesuaikan Foto</h3>
                            <button onClick={() => setImageSrc(null)} className="text-gray-400 hover:text-red-500">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="relative h-64 bg-gray-900">
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                                cropShape={cropShape}
                            />
                        </div>

                        <div className="p-4 space-y-4">
                            <div className="flex items-center gap-2">
                                <ZoomOut size={16} className="text-gray-400" />
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    aria-labelledby="Zoom"
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                                <ZoomIn size={16} className="text-gray-400" />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setImageSrc(null)}
                                    className="flex-1 py-2 rounded-lg font-bold text-sm text-gray-600 hover:bg-gray-100 border border-transparent"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={uploading}
                                    className="flex-1 py-2 rounded-lg font-bold text-sm bg-navy text-white hover:bg-navy/90 flex items-center justify-center gap-2"
                                >
                                    {uploading ? 'Menyimpan...' : <> <Check size={16} /> Simpan Foto </>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
