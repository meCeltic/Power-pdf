import Link from "next/link"
import { redirect } from "next/navigation"
import MaxWidthWrapper from "@/components/MaxWidthWrapper"
import AuthForm from "@/components/AuthForm"
import { getUser } from "@/lib/auth"
import { signIn } from "./actions"

const Page = async ({ searchParams }: { searchParams: { next?: string } }) => {
  if (await getUser()) redirect("/dashboard")
  const next = searchParams.next ?? ""
  const other = next ? `/sign-up?next=${encodeURIComponent(next)}` : "/sign-up"
  return (
    <MaxWidthWrapper className="mb-12 mt-20 flex flex-col items-center text-center">
      <h1 className="text-3xl font-bold">Sign in to PowerPDF</h1>
      <p className="mt-2 text-zinc-700">Enter your email and password to continue.</p>
      <AuthForm mode="sign-in" action={signIn} next={next} />
      <p className="mt-6 text-sm text-zinc-700">
        Don&apos;t have an account?{" "}
        <Link href={other} className="font-semibold underline">Sign up</Link>
      </p>
    </MaxWidthWrapper>
  )
}

export default Page
