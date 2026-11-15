"use client"

import { useState } from "react"
import { ArrowRight, Rocket } from "lucide-react"
import { Button } from "./ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"

// Payments are not live yet: the upgrade button only explains that Pro is coming soon.
const UpgradeButton = ({ label = "Upgrade now" }: { label?: string }) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)} className="w-full">
        {label} <ArrowRight className="h-5 w-5 ml-1.5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="items-center text-center">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
              <Rocket className="h-6 w-6 text-blue-600" />
            </div>
            <DialogTitle className="text-2xl">Pro is coming soon</DialogTitle>
            <DialogDescription className="text-base">
              Payments aren&apos;t open yet. Until then, every account gets the Free plan at no
              cost, so you can keep uploading and chatting with your PDFs.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button onClick={() => setOpen(false)} className="w-full sm:w-auto">
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default UpgradeButton
