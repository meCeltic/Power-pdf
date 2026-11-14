import Link from "next/link";
import MaxWidthWrapper from "./MaxWidthWrapper";
import { buttonVariants } from "./ui/button";
import { getUser } from "@/lib/auth";
import { ArrowRight } from "lucide-react";
import UserAccountNav from "./UserAccountNav";
import MobileNav from "./MobileNav";
import { SOURCE_CODE } from "@/config/links";
import Image from "next/image";

const Navbar = async () => {



    const user = await getUser()
  return (
    <nav className="sticky h-14 inset-x-0 top-0 z-30 w-full border-b border-gray-200 bg-white/75 backdrop-blur-lg transition-all">
        <MaxWidthWrapper>
            <div className="flex h-14 items-center justify-between border-b border-zinc-200 ">
                <Link href="/" className="flex z-40 font-semibold ">
                    <span>PowerPDF</span>
                </Link>

                <div className="flex items-center justify-center space-x-4">

                <MobileNav isAuth={!!user}/>

                <div className="hidden sm:flex">
                    { !user ? <>
                        <Link href="/sign-in" className={buttonVariants({
                            variant: "ghost",
                            size: "sm"
                        })}>Sign in</Link>

                        <Link href="/sign-in" className={buttonVariants({
                            size: "sm"
                        })}>Get Started <ArrowRight className="ml-1.5 h-5 w-5"/>
                        </Link>
            
                    </> : <>
                    <Link href="/dashboard" className={buttonVariants({
                            variant: "ghost",
                            size: "sm"
                        })}>Dashboard</Link>

                        <UserAccountNav email={user.email} imageUrl='' name={user.name || "Your Account"}/>
                    </>}
                </div>

                <Link href={SOURCE_CODE} target="_blank" rel='noreferrer noopener'>
                    <Image src="/github.svg" height={25} width={25} alt="Github"/>
                </Link>
            </div>   
            </div>
        </MaxWidthWrapper>
    </nav>
  );
};

export default Navbar;
