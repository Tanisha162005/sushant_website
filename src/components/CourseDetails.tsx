'use client';

interface CourseData {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number | null;
  imageUrl?: string | null;
  downloadUrl: string | null;
  category?: string | null;
}

interface CourseDetailsProps {
  course: CourseData;
}

export const CourseDetails = ({ course }: CourseDetailsProps) => {
  return (
    <div className="course-details">
      {/* Thumbnail for Left Column */}
      <div className="course-details-main-img-container" style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: '16px', overflow: 'hidden', marginBottom: '2rem', background: '#1e1b4b', border: '1px solid rgba(255,255,255,0.08)' }}>
        {course.imageUrl ? (
          <img src={course.imageUrl} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎬</div>
              <div style={{ fontWeight: 600 }}>{course.title}</div>
            </div>
          </div>
        )}
        {course.category && (
          <div style={{ position: 'absolute', top: '16px', left: '16px', background: 'rgba(168, 85, 247, 0.9)', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, backdropFilter: 'blur(4px)' }}>
            {course.category}
          </div>
        )}
      </div>

      <div className="course-details-section" style={{ paddingTop: 0 }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginBottom: '1rem', lineHeight: 1.3 }}>
          {course.title}
        </h2>
        
        <div style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.8 }}>
          {course.description.split('\n').map((para, i) => (
            <p key={i} style={{ marginBottom: '1rem' }}>
              {para}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};
