export interface ServiceConfig {
  name: string
  description: string
  url: string
  icon: string
  category: 'den' | 'kitchen-tasks' | 'media' | 'ops' | 'public'
  internalRoute?: string
}

export const SERVICES: ServiceConfig[] = [
  // Den — custom modules (use internalRoute)
  {
    name: 'Job Tracker',
    description: 'Track job applications and interviews',
    url: 'https://life.redpandacreations.co.uk/jobs',
    icon: 'Briefcase',
    category: 'den',
    internalRoute: '/jobs',
  },
  {
    name: 'Knowledge Base',
    description: 'Learning topics, resources, and notes',
    url: 'https://life.redpandacreations.co.uk/knowledge',
    icon: 'BookOpen',
    category: 'den',
    internalRoute: '/knowledge',
  },
  {
    name: 'Medication Tracker',
    description: 'Medication schedules and stock levels',
    url: 'https://life.redpandacreations.co.uk/medication',
    icon: 'Pill',
    category: 'den',
    internalRoute: '/medication',
  },

  // Kitchen & Tasks
  {
    name: 'Mealie',
    description: 'Recipes and meal planning',
    url: 'https://meals.redpandacreations.co.uk',
    icon: 'UtensilsCrossed',
    category: 'kitchen-tasks',
  },
  {
    name: 'Actual Budget',
    description: 'Personal finance and budgeting',
    url: 'https://money.redpandacreations.co.uk',
    icon: 'PoundSterling',
    category: 'kitchen-tasks',
  },
  {
    name: 'Vikunja',
    description: 'Tasks and project management',
    url: 'https://tasks.redpandacreations.co.uk',
    icon: 'CheckSquare',
    category: 'kitchen-tasks',
  },
  {
    name: 'Wiki.js',
    description: 'Knowledge wiki and documentation',
    url: 'https://wiki.redpandacreations.co.uk',
    icon: 'FileText',
    category: 'kitchen-tasks',
  },

  // Media Den
  {
    name: 'Jellyfin',
    description: 'Media server',
    url: 'https://jellyfin.redpandacreations.co.uk',
    icon: 'Play',
    category: 'media',
  },
  {
    name: 'Sonarr',
    description: 'TV series management',
    url: 'https://sonarr.redpandacreations.co.uk',
    icon: 'Tv',
    category: 'media',
  },
  {
    name: 'Radarr',
    description: 'Movie management',
    url: 'https://radarr.redpandacreations.co.uk',
    icon: 'Film',
    category: 'media',
  },
  {
    name: 'Prowlarr',
    description: 'Indexer management',
    url: 'https://prowlarr.redpandacreations.co.uk',
    icon: 'Search',
    category: 'media',
  },
  {
    name: 'qBittorrent',
    description: 'Download client',
    url: 'https://qbit.redpandacreations.co.uk',
    icon: 'Download',
    category: 'media',
  },
  {
    name: 'Jellyseerr',
    description: 'Media request management',
    url: 'https://jellyseerr.redpandacreations.co.uk',
    icon: 'Star',
    category: 'media',
  },

  // Ops
  {
    name: 'Ntfy',
    description: 'Push notifications',
    url: 'https://ntfy.redpandacreations.co.uk',
    icon: 'Bell',
    category: 'ops',
  },
  {
    name: 'Uptime Kuma',
    description: 'Service uptime monitoring',
    url: 'https://status.redpandacreations.co.uk',
    icon: 'Activity',
    category: 'ops',
  },
  {
    name: 'Dozzle',
    description: 'Docker container logs',
    url: 'https://logs.redpandacreations.co.uk',
    icon: 'ScrollText',
    category: 'ops',
  },
  {
    name: 'Traefik',
    description: 'Reverse proxy dashboard',
    url: 'https://traefik.redpandacreations.co.uk',
    icon: 'Network',
    category: 'ops',
  },

  // Public
  {
    name: 'Ghost Blog',
    description: 'Portfolio and blog',
    url: 'https://redpandacreations.co.uk',
    icon: 'Globe',
    category: 'public',
  },
  {
    name: 'Shop',
    description: 'Commissions and products',
    url: 'https://shop.redpandacreations.co.uk',
    icon: 'ShoppingBag',
    category: 'public',
  },
]
