'use client'

interface PersonSidebarProps {
  people: string[]
  selectedPerson: string
  onSelectPerson: (person: string) => void
}

export default function PersonSidebar({
  people,
  selectedPerson,
  onSelectPerson,
}: PersonSidebarProps) {
  return (
    <aside className="person-sidebar">
      <ul>
        {people.map((person) => (
          <li key={person}>
            <button
              className={person === selectedPerson ? 'active' : ''}
              onClick={() => onSelectPerson(person)}
            >
              {person}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  )
}
