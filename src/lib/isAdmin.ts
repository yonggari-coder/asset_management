import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";

export async function requireAdmin(){
    const session = await getServerSession(authOptions);
    const email = session?.user?.email?.toLowerCase() || "";
    const admins = (process.env.ADMIN_EMAILS || "").toLowerCase().split(",").map(s => s.trim());
    if (!email || !admins.includes(email)) {
        throw new Error("Forbidden: 관리자 권한이 필요합니다.");
    }
    return { email };
}