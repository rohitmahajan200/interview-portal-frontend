/* ───────────────── GloryDisplay.tsx ───────────────── */
import { useState, type FC } from 'react';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp, Star } from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from './ui/button';

type GradesObject = Record<string, string> | Map<string, string>;

interface RoleBlock {
  grades: GradesObject;
  graderName?: string;
  gradedAt?: string;
}

export interface GloryDisplayProps {
  /* glory.hr | glory.manager | … exactly as stored on Candidate */
  glory: Record<string, RoleBlock>;
}

/* ── helpers for consistent colours ────────────────── */
const roleColor = (role: string) => ({
  hr:          'bg-purple-100 text-purple-800',
  manager:     'bg-blue-100 text-blue-800',
  invigilator: 'bg-green-100 text-green-800',
}[role] ?? 'bg-gray-100 text-gray-800');

const gradeColor = (g: string) => ({
  'A+': 'bg-green-100 text-green-800',
  A:   'bg-green-100 text-green-700',
  B:   'bg-blue-100  text-blue-700',
  C:   'bg-yellow-100 text-yellow-700',
  D:   'bg-orange-100 text-orange-700',
  E:   'bg-red-100    text-red-700',
}[g] ?? 'bg-gray-100 text-gray-700');





/* ── component ─────────────────────────────────────── */
const GloryDisplay: FC<GloryDisplayProps> = ({ glory }) => {
const [hrResponsesCollapsed,setHrResponsesCollapsed]=useState(false);


  if ( !glory || Object.keys(glory).length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
          <Star className="h-5 w-5 text-purple-600" />
          Glory Grades
          </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHrResponsesCollapsed(!hrResponsesCollapsed)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <span className="text-sm font-medium">
                  {hrResponsesCollapsed ? 'Show' : 'Hide'}
                </span>
                {hrResponsesCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </Button>
          
        </CardTitle>
        
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {Object.entries(glory).map(([role, data]) => {
            if (!data?.grades) return null;

            const gradesObj =
              data.grades instanceof Map
                ? Object.fromEntries(data.grades)
                : data.grades;

            if (Object.keys(gradesObj).length === 0) return null;

            return (
              !hrResponsesCollapsed && 
              <div
                key={role}
                className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20
                           rounded-lg border border-purple-200 dark:border-purple-800"
              >
                {/* header strip */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge className={roleColor(role)} variant="outline">
                      {role.toUpperCase()}
                    </Badge>
                    {data.graderName && (
                      <span className="text-sm text-muted-foreground">
                        by {data.graderName}
                      </span>
                    )}
                  </div>

                  {data.gradedAt && (
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(data.gradedAt), 'MMM dd, yyyy')}
                    </span>
                  )}
                </div>

                {/* grades grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(gradesObj).map(([param, grade]) => (
                    <div
                      key={param}
                      className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border"
                    >
                      <span className="text-sm font-medium text-purple-700 dark:text-purple-300 truncate">
                        {param}
                      </span>

                      <Badge
                        className={`text-xs font-bold ${gradeColor(grade)}`}
                      >
                        {grade}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default GloryDisplay;
