import { FileText, FileSpreadsheet, Presentation, File } from 'lucide-react';

const KINDS = {
  pdf: [FileText, 'pdf'],
  doc: [FileText, 'word'], docx: [FileText, 'word'],
  xls: [FileSpreadsheet, 'excel'], xlsx: [FileSpreadsheet, 'excel'],
  ppt: [Presentation, 'word'], pptx: [Presentation, 'word'],
};

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return Math.max(1, Math.round(bytes / 1024)) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function MaterialCard({ material, hideCourse }) {
  const [Icon, kind] = KINDS[String(material.type || '').toLowerCase()] || [File, 'other'];
  const meta = [hideCourse ? null : material.course_code, material.category, formatSize(material.size_bytes), material.contributor_name]
    .filter(Boolean).join(' \u2022 ');
  return (
    <div className="file-row">
      <div className={'file-icon icon-' + kind}><Icon size={24} /></div>
      <div className="file-info">
        <h4>{material.title}</h4>
        <p>{meta}</p>
      </div>
    </div>
  );
}
