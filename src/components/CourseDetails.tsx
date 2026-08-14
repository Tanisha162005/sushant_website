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
  const renderTitle = (title: string) => {
    const separator = title.includes('–') ? '–' : title.includes('-') ? '-' : null;
    if (separator) {
      const parts = title.split(separator);
      const main = parts[0].trim();
      const sub = parts.slice(1).join(separator).trim();
      return (
        <>
          {main}
          <span style={{ display: 'block', fontSize: '70%', color: 'rgba(255,255,255,0.7)', marginTop: '0.4rem', fontWeight: 700 }}>
            {separator} {sub}
          </span>
        </>
      );
    }
    return title;
  };

  return (
    <div className="course-details">
      {/* Thumbnail for Left Column */}
      <div className="course-details-main-img-container" style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: '16px', overflow: 'hidden', margin: '0 auto 2rem auto', background: '#1e1b4b', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 15px 40px rgba(0,0,0,0.4)' }}>
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
          <div style={{ position: 'absolute', top: '16px', left: '16px', background: 'rgba(168, 85, 247, 0.9)', color: '#fff', padding: '6px 16px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800, backdropFilter: 'blur(4px)', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
            {course.category}
          </div>
        )}
      </div>

      <div className="course-details-section" style={{ paddingTop: 0 }}>
        <h2 style={{ fontSize: '2.25rem', fontWeight: 900, color: '#fff', marginBottom: '2rem', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
          {renderTitle(course.title)}
        </h2>
        
        {/* Horizontal Flow Description */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '1.05rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
          {course.description.split('\n').map((para, i) => {
            if (!para.trim()) return null;
            
            // Smart formatting: if it's a short point or a question, make it a nice card. 
            // If it's a long paragraph, let it span full width.
            const isCard = para.length < 120 && (para.includes('?') || para.trim().startsWith('-'));
            
            return (
              <div key={i} className={`course-detail-desc-card ${isCard ? 'is-card' : 'is-full'}`}>
                {para}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

