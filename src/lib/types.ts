export interface Experience {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  imageUrl: string;
  duration: string;
}

export interface Booking {
  id: string;
  userId?: string;
  experienceType: string;
  dateReserved: string;
  timeSlot: string;
  durationHours: number;
  participantCount: number;
  skillLevel: 'beginner' | 'intermediate' | 'expert';
  priceTotal: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface BookingFormData {
  experienceType: string;
  dateReserved: string;
  timeSlot: string;
  durationHours: number;
  participantCount: number;
  skillLevel: string;
}
