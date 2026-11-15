import MaxWidthWrapper from "@/components/MaxWidthWrapper"
import UpgradeButton from "@/components/UpgradeButton"
import { buttonVariants } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { PLANS } from "@/config/plans"
import { getUser } from "@/lib/auth"
import { cn } from "@/lib/utils"
import { ArrowRight, Check, HelpCircle, Minus } from "lucide-react"
import Link from "next/link"

export const metadata = { title: "Pricing · PowerPDF" }

const Page = async () => {
  const user = await getUser()

  return (
    <MaxWidthWrapper className="mb-8 mt-24 text-center max-w-5xl">
      <div className="mx-auto mb-10 sm:max-w-lg">
        <h1 className="text-6xl font-bold sm:text-7xl">Pricing</h1>
        <p className="mt-5 text-gray-600 sm:text-lg">
          Whether you&apos;re just trying out PowerPDF or need more, we&apos;ve got you covered.
        </p>
      </div>

      <div className="pt-12 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <TooltipProvider>
          {PLANS.map(({ name, tagline, price, quota, features }) => (
            <div
              key={name}
              className={cn("relative rounded-2xl bg-white shadow-lg", {
                "border-2 border-blue-600 shadow-blue-200": name === "Pro",
                "border border-gray-200": name !== "Pro",
              })}
            >
              {name === "Pro" && (
                <div className="absolute -top-5 left-0 right-0 mx-auto w-32 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 px-3 py-2 text-sm font-medium text-white">
                  Coming soon
                </div>
              )}

              <div className="p-5">
                <h3 className="my-3 text-center font-display text-3xl font-bold">{name}</h3>
                <p className="text-gray-500">{tagline}</p>
                <p className="my-5 font-display text-6xl font-semibold">${price}</p>
                <p className="text-gray-500">per month</p>
              </div>

              <div className="flex h-20 items-center justify-center border-b border-t border-gray-200 bg-gray-50">
                <p>{quota} included</p>
              </div>

              <ul className="my-10 space-y-5 px-8">
                {features.map(({ text, footnote, negative }) => (
                  <li className="flex space-x-5" key={text}>
                    <div className="flex-shrink-0">
                      {negative ? (
                        <Minus className="h-6 w-6 text-gray-300" />
                      ) : (
                        <Check className="h-6 w-6 text-blue-500" />
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <p className={cn("text-left", negative ? "text-gray-400" : "text-gray-700")}>{text}</p>
                      {footnote ? (
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger className="cursor-default ml-1.5" aria-label={footnote}>
                            <HelpCircle className="h-4 w-4 text-zinc-500" />
                          </TooltipTrigger>
                          <TooltipContent className="w-80 p-2">{footnote}</TooltipContent>
                        </Tooltip>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>

              <div className="border-t border-gray-200" />
              <div className="p-5">
                {name === "Free" ? (
                  <Link
                    href={user ? "/dashboard" : "/sign-up"}
                    className={buttonVariants({ className: "w-full", variant: "secondary" })}
                  >
                    {user ? "Go to dashboard" : "Get started"}
                    <ArrowRight className="h-5 w-5 ml-1.5" />
                  </Link>
                ) : (
                  <UpgradeButton />
                )}
              </div>
            </div>
          ))}
        </TooltipProvider>
      </div>
    </MaxWidthWrapper>
  )
}

export default Page
