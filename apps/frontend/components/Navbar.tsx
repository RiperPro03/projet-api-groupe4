import Link from "next/link";
import {DiaTextReveal} from "@/components/ui/dia-text-reveal";
import { AiOutlineShoppingCart } from 'react-icons/ai';

export default function Navbar() {
    return (

        <nav className="bg-gray-800 text-white p-4">
            <div className="container mx-auto flex justify-between items-center">
                <Link href="/">
                <span className="text-2xl font-bold cursor-pointer">
                    <DiaTextReveal
                    className="text-4xl font-bold tracking-tight"
                    colors={["#22d3ee", "#818cf8", "#f472b6", "#34d399"]}
                    textColor="white"
                    text="Fake Store"
                    />
                </span>

                </Link>

                <Link href="/cart">
                    <AiOutlineShoppingCart className="text-2xl cursor-pointer" />
                </Link>
            </div>
        </nav>
    );
}