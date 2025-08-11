export interface HomeCell {
  id: number;
  name: string;
  leader: string;
  leaderPhone: string;
  meetingDay: string;
  meetingTime: string;
  location: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Default home cells as specified by the user
const DEFAULT_HOME_CELLS: Omit<HomeCell, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: "Israel",
    leader: "",
    leaderPhone: "",
    meetingDay: "",
    meetingTime: "",
    location: "",
    description: "Israel Home Cell",
    isActive: true,
  },
  {
    name: "Judah",
    leader: "",
    leaderPhone: "",
    meetingDay: "",
    meetingTime: "",
    location: "",
    description: "Judah Home Cell",
    isActive: true,
  },
  {
    name: "Zion",
    leader: "",
    leaderPhone: "",
    meetingDay: "",
    meetingTime: "",
    location: "",
    description: "Zion Home Cell",
    isActive: true,
  },
  {
    name: "Bethel",
    leader: "",
    leaderPhone: "",
    meetingDay: "",
    meetingTime: "",
    location: "",
    description: "Bethel Home Cell",
    isActive: true,
  },
  {
    name: "Jerusalem",
    leader: "",
    leaderPhone: "",
    meetingDay: "",
    meetingTime: "",
    location: "",
    description: "Jerusalem Home Cell",
    isActive: true,
  },
  {
    name: "Horeb",
    leader: "",
    leaderPhone: "",
    meetingDay: "",
    meetingTime: "",
    location: "",
    description: "Horeb Home Cell",
    isActive: true,
  },
];

export class HomeCellService {
  private storageKey = 'homeCells';

  constructor() {
    this.initializeDefaultHomeCells();
  }

  private initializeDefaultHomeCells(): void {
    const existing = this.getAllHomeCells();
    if (existing.length === 0) {
      const defaultCells = DEFAULT_HOME_CELLS.map((cell, index) => ({
        ...cell,
        id: index + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      
      localStorage.setItem(this.storageKey, JSON.stringify(defaultCells));
    }
  }

  getAllHomeCells(): HomeCell[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading home cells:', error);
      return [];
    }
  }

  getActiveHomeCells(): HomeCell[] {
    return this.getAllHomeCells().filter(cell => cell.isActive);
  }

  getHomeCellById(id: number): HomeCell | null {
    const cells = this.getAllHomeCells();
    return cells.find(cell => cell.id === id) || null;
  }

  createHomeCell(cellData: Omit<HomeCell, 'id' | 'createdAt' | 'updatedAt'>): HomeCell {
    const cells = this.getAllHomeCells();
    const newId = Math.max(0, ...cells.map(c => c.id)) + 1;
    
    const newCell: HomeCell = {
      ...cellData,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedCells = [...cells, newCell];
    localStorage.setItem(this.storageKey, JSON.stringify(updatedCells));
    
    return newCell;
  }

  updateHomeCell(id: number, updates: Partial<Omit<HomeCell, 'id' | 'createdAt'>>): HomeCell | null {
    const cells = this.getAllHomeCells();
    const index = cells.findIndex(cell => cell.id === id);
    
    if (index === -1) return null;

    const updatedCell = {
      ...cells[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    cells[index] = updatedCell;
    localStorage.setItem(this.storageKey, JSON.stringify(cells));
    
    return updatedCell;
  }

  deleteHomeCell(id: number): boolean {
    const cells = this.getAllHomeCells();
    const filteredCells = cells.filter(cell => cell.id !== id);
    
    if (filteredCells.length === cells.length) return false;

    localStorage.setItem(this.storageKey, JSON.stringify(filteredCells));
    return true;
  }

  deactivateHomeCell(id: number): boolean {
    return this.updateHomeCell(id, { isActive: false }) !== null;
  }

  activateHomeCell(id: number): boolean {
    return this.updateHomeCell(id, { isActive: true }) !== null;
  }

  // Get home cell statistics
  getHomeCellStats() {
    const cells = this.getAllHomeCells();
    return {
      total: cells.length,
      active: cells.filter(c => c.isActive).length,
      inactive: cells.filter(c => !c.isActive).length,
    };
  }
}

export const homeCellService = new HomeCellService();
