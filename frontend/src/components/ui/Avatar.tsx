interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  online?: boolean
  group?: boolean
}

const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg' }
const dotSizes = { sm: 'w-2 h-2', md: 'w-2.5 h-2.5', lg: 'w-3.5 h-3.5' }

export default function Avatar({ name, size = 'md', online, group }: AvatarProps) {
  const letter = name.charAt(0).toUpperCase()
  return (
    <div className="relative flex-shrink-0">
      <div
        className={`${sizes[size]} rounded-full bg-accent flex items-center justify-center font-semibold text-on-accent select-none`}
      >
        {group ? (
          <svg className="w-1/2 h-1/2 text-on-accent" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 12.094A5.973 5.973 0 004 15v1H1v-1a3 3 0 013.75-2.906z" />
          </svg>
        ) : (
          letter
        )}
      </div>
      {online !== undefined && (
        <span
          className={`absolute bottom-0 right-0 ${dotSizes[size]} rounded-full border-2 border-secondary ${online ? 'bg-online' : 'bg-[var(--text-secondary)]'}`}
        />
      )}
    </div>
  )
}
