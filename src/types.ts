export interface DatabaseResult {
  recordset?: any[];
  rowsAffected?: number[];
}

export interface SSHConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
}

export interface LogEntry {
  id: string;
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  timestamp: string;
}

export interface MuClass {
  id: number;
  name: string;
  short: string;
  color: string;
}

export interface MuMap {
  id: number;
  name: string;
}

export interface MuItem {
  group: number;
  id: number;
  name: string;
  slot: string;
}

export interface MuEvent {
  name: string;
  interval: number;
  next: string;
}

export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  priority?: PriorityLevel;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

