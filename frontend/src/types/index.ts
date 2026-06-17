export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: '管理员' | '巡看人员' | '活动领队';
  created_at: string;
}

export interface TrailSegment {
  id: number;
  name: string;
  description?: string;
  start_point?: string;
  end_point?: string;
  length_km?: number;
  difficulty?: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

export interface ObservationPoint {
  id: number;
  name: string;
  segment_id: number;
  description?: string;
  latitude?: number;
  longitude?: number;
  has_bleachers: number;
  bleachers_status: string;
  status: string;
  created_at: string;
}

export interface ActivityRoute {
  id: number;
  name: string;
  description?: string;
  segment_ids?: string;
  estimated_duration_minutes?: number;
  max_people?: number;
  difficulty?: string;
  status: string;
  created_at: string;
}

export interface Equipment {
  id: number;
  name: string;
  category?: string;
  quantity: number;
  location?: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface InspectionCycle {
  id: number;
  segment_id: number;
  cycle_days: number;
  last_inspection_date?: string;
  next_inspection_date?: string;
  created_at: string;
  updated_at?: string;
}

export interface InspectionRecord {
  id: number;
  segment_id: number;
  inspector_id: number;
  inspection_date: string;
  obstruction_status?: string;
  obstruction_details?: string;
  slippery_warning?: string;
  slippery_details?: string;
  bleachers_status?: string;
  bleachers_details?: string;
  overall_status: string;
  suggestions?: string;
  created_at: string;
}

export interface ActivityBatch {
  id: number;
  route_id: number;
  leader_id: number;
  batch_name: string;
  people_count: number;
  activity_date: string;
  start_time?: string;
  end_time?: string;
  status: string;
  notes?: string;
  risk_level?: string;
  risk_summary?: string;
  risk_confirmed?: number;
  created_at: string;
}

export interface RiskFactor {
  type: string;
  segment_id: number;
  segment_name: string;
  reason: string;
  risk_level: string;
  status?: string;
  abnormal_point_count?: number;
  point_names?: string;
  inspection_date?: string;
  overall_status?: string;
  anomaly_items?: string[];
  days_overdue?: number;
  recent_anomaly_count?: number;
  next_inspection_date?: string;
}

export interface RouteRiskAssessment {
  route_id: number;
  route_name: string;
  risk_level: string;
  risk_factors: RiskFactor[];
  suggestions: string[];
  needs_confirmation: boolean;
}

export interface RouteChange {
  id: number;
  batch_id: number;
  original_route_id?: number;
  new_route_description?: string;
  reason?: string;
  change_time: string;
  created_at: string;
}

export interface Feedback {
  id: number;
  batch_id: number;
  leader_id: number;
  rating: number;
  content?: string;
  issues_encountered?: string;
  suggestions?: string;
  created_at: string;
}

export type StatusType = '正常开放' | '待巡看' | '局部绕行' | '维护处理中' | '已恢复';
