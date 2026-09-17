import { withBasePath } from "@/lib/base-path"

type Props = {
  className?: string
  alt?: string
}

export function BrandLogo({ className = "h-10 w-10 object-contain", alt = "DFoodie" }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={withBasePath("/foodie-logo.jpg")} alt={alt} className={className} />
  )
}
