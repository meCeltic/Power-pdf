"use client"

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog'
import { Button } from './ui/button'
import Dropzone from "react-dropzone"
import { Cloud, File, Loader2 } from 'lucide-react'
import { Progress } from './ui/progress'
import { useToast } from './ui/use-toast'
import { useRouter } from 'next/navigation'
import { upload as blobUpload } from '@vercel/blob/client'

type Mode= 'disk' | 'blob'
type Access= 'private' | 'public'

const UploadDropzone = ({mode, access, prefix}: {mode: Mode, access: Access, prefix: string})=>{

    const router= useRouter()

    const [isUploading, setIsUploading]= useState(false)
    const [uploadProgress, setUploadProgress]= useState(0)

    const {toast}= useToast()

    const fail= (description= "Please try again later")=>{
        setIsUploading(false)
        setUploadProgress(0)
        toast({
            title: "Something went wrong",
            description,
            variant: "destructive"
        })
    }

    const upload= (file: File)=> new Promise<{id: string}>((resolve, reject)=>{
        const xhr= new XMLHttpRequest()
        xhr.open("POST", "/api/upload")
        xhr.upload.onprogress= (e)=>{
            // upload accounts for 0-90%; the rest is server-side indexing
            if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 90))
        }
        xhr.onload= ()=>{
            if (xhr.status >= 200 && xhr.status < 300){
                try { resolve(JSON.parse(xhr.responseText)) } catch { reject(new Error("Bad response")) }
            } else reject(new Error(xhr.responseText || `Upload failed (${xhr.status})`))
        }
        xhr.onerror= ()=> reject(new Error("Network error"))
        const body= new FormData()
        body.append("file", file)
        xhr.send(body)
    })

    // Blob mode: browser -> Vercel Blob directly (function bodies are capped at 4.5MB),
    // then the server verifies and indexes the blob.
    const uploadViaBlob= async (file: File)=>{
        const safe= file.name.replace(/[^\w.-]+/g, "_").replace(/\.pdf$/i, "") || "document"
        const pathname= `${prefix}${crypto.randomUUID()}-${safe}.pdf`
        const blob= await blobUpload(pathname, file, {
            access,
            handleUploadUrl: "/api/blob-upload",
            multipart: true,
            contentType: "application/pdf",
            onUploadProgress: (e)=> setUploadProgress(Math.round(e.percentage * 0.9)),
        })
        const res= await fetch("/api/files/register", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({pathname: blob.pathname, name: file.name}),
        })
        if (!res.ok) throw new Error((await res.text()) || `Upload failed (${res.status})`)
        return (await res.json()) as {id: string}
    }

    return (
    <Dropzone 
    multiple={false}
    accept={{"application/pdf": [".pdf"]}}
    maxSize={16 * 1024 * 1024}
    onDropRejected={()=> fail("Please choose a PDF up to 16MB")}
    onDrop={async (acceptedFile)=>{
        if (!acceptedFile[0]) return
        setIsUploading(true)
        setUploadProgress(0)

        try {
            const {id}= mode==='blob' ? await uploadViaBlob(acceptedFile[0]) : await upload(acceptedFile[0])
            setUploadProgress(100)
            router.push(`/dashboard/${id}`)
        } catch (err) {
            fail(err instanceof Error ? err.message : undefined)
        }
    }}>
        {({getRootProps, getInputProps, acceptedFiles}) => (
            <div {...getRootProps()} className='border h-64 m-4 border-dashed border-gray-300 rounded-lg'>
                <div className="flex items-center justify-center h-full w-full">
                    <label htmlFor="dropzone-file" className='flex flex-col items-center justify-center w-full h-full rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100'>
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Cloud className='h-6 w-6 text-zinc-500 mb-2'/>
                            <p className="mb-2 text-sm text-zinc-700">
                                <span className="font-semibold">Click to upload</span> or drag and drop.
                            </p>
                            <p className='text-xs text-zinc-500'>PDF (up to 16MB)</p>
                        </div>

                        {acceptedFiles && acceptedFiles[0] ? (
                            <div className="max-w-xs bg-white flex items-center rounded-md overflow-hidden outline outline-[1px] outiline-zinc-200 divide-x divide-zinc-200">
                                <div className="px-3 py-2 h-full grid place-items-center">
                                    <File className='h-4 w-4 text-blue-500'/>
                                </div>
                                <div className="px-3 py-2 h-full text-sm truncate">
                                    {acceptedFiles[0].name}
                                </div>
                            </div>
                        ): null}

                        {isUploading? (
                            <div className="w-full mt-4 max-w-xs mx-auto">
                                <Progress 
                                indicatorColor={
                                    uploadProgress===100? "bg-green-500": ""
                                }
                                value={uploadProgress} className='h-1 w-full bg-zinc-200'/>
                                {uploadProgress===100 ?(
                                    <div className="flex gap-1 items-center justify-center text-sm text-zinc-700 text-center pt-2">
                                        <Loader2 className='h-3 w-3 animate-spin'/>
                                        Redirecting...
                                    </div>
                                ): null}
                            </div>
                        ) : null}

                        <input {...getInputProps()} type='file' id='dropzone-file' className='hidden'></input>
                    </label> 
                </div>
            </div>
        )}
    </Dropzone>

)}

const UploadButton = ({mode='disk', access='private', prefix=''}: {mode?: Mode, access?: Access, prefix?: string}) => {

  const [isOpen, setIsOpen]= useState(false)  
  return (
    <Dialog open={isOpen} onOpenChange={(v)=>{
        if (!v){setIsOpen(v)}
    }}>
        <DialogTrigger asChild onClick={()=>setIsOpen(true)}>
            <Button>Upload PDF</Button>
        </DialogTrigger>


        <DialogContent>
            <UploadDropzone mode={mode} access={access} prefix={prefix}/>
        </DialogContent>
    </Dialog>
  )
}

export default UploadButton