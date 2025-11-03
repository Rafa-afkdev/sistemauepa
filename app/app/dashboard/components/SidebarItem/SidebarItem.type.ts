import { LucideIcon } from "lucide-react"

export type SidebarItemProps = {
    item: {
        label: string,
        icon: LucideIcon,
        href: string
    },
    key: string,
    className?: string; // Agrega esto si usas className

}