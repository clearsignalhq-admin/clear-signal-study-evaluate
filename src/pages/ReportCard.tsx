import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card } from 'primereact/card'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { ProgressBar } from 'primereact/progressbar'
import { Button } from 'primereact/button'
import { questionService } from '../services/questionService'

interface SubjectStats {
    code: string;
    name: string;
    totalQuestionsInBank: number;
    questionsAnsweredUnique: number;
    totalAttempts: number;
    coverage: number;
}

interface ExamHistoryItem {
    subjectId: string;
    answers: { questionId: number }[];
}

export default function ReportCard() {
    const [stats, setStats] = useState<SubjectStats[]>([])

    useEffect(() => {
        // 1. Get all subjects
        const subjects = questionService.getSubjects();

        // 2. Get history
        const history: ExamHistoryItem[] = JSON.parse(localStorage.getItem('exam_history') || '[]');

        // 3. Aggregate
        // Map<SubjectCode, { uniqueIds: Set<number>, attempts: number }>
        const statsMap = new Map<string, { uniqueIds: Set<number>, attempts: number }>();

        // Initialize map
        subjects.forEach(sub => {
            statsMap.set(sub.code, { uniqueIds: new Set(), attempts: 0 });
        });

        // Process history
        history.forEach(exam => {
            const subStats = statsMap.get(exam.subjectId);
            // If we have stats for this subject (e.g. it hasn't been removed from the system)
            if (subStats) {
                if (exam.answers && Array.isArray(exam.answers)) {
                    exam.answers.forEach(ans => {
                        subStats.uniqueIds.add(ans.questionId);
                        subStats.attempts++;
                    });
                }
            }
        });

        // Format for display
        const finalStats: SubjectStats[] = subjects.map(sub => {
            const data = statsMap.get(sub.code) || { uniqueIds: new Set(), attempts: 0 };
            const uniqueCount = data.uniqueIds.size;
            
            return {
                code: sub.code,
                name: sub.name,
                totalQuestionsInBank: sub.totalQuestions,
                questionsAnsweredUnique: uniqueCount,
                totalAttempts: data.attempts,
                coverage: sub.totalQuestions > 0 ? (uniqueCount / sub.totalQuestions) * 100 : 0
            };
        });

        setStats(finalStats);
    }, [])

    const coverageBodyTemplate = (rowData: SubjectStats) => {
        return (
            <div className="flex align-items-center gap-2">
                <div style={{ width: '100px' }}>
                    <ProgressBar value={rowData.coverage} showValue={false} style={{ height: '8px' }} color={rowData.coverage === 100 ? '#22c55e' : '#6366f1'}></ProgressBar>
                </div>
                <span className="text-sm text-600">{Math.round(rowData.coverage)}%</span>
            </div>
        );
    }

    const actionBodyTemplate = (rowData: SubjectStats) => {
        return (
            <Link to={`/report-card/${rowData.code}`}>
                <Button icon="pi pi-chart-line" rounded text severity="secondary" aria-label="View Chart" />
            </Link>
        );
    }

    const nameBodyTemplate = (rowData: SubjectStats) => {
        return (
            <Link to={`/report-card/${rowData.code}`} className="text-900 no-underline hover:text-primary transition-colors">
                {rowData.name}
            </Link>
        );
    }

    return (
        <div className="flex justify-content-center">
            <div className="w-full md:w-10 lg:w-8">
                <div className="mb-4">
                    <h1 className="text-3xl font-bold m-0 text-900">Report Card</h1>
                    <p className="text-600 m-0">Detailed breakdown of your practice coverage.</p>
                </div>

                <Card className="shadow-2 border-round-xl">
                    <DataTable value={stats} stripedRows tableStyle={{ minWidth: '50rem' }}>
                        <Column field="name" header="Subject" body={nameBodyTemplate} sortable className="font-bold"></Column>
                        <Column field="totalQuestionsInBank" header="Total Questions" sortable className="text-center"></Column>
                        <Column field="questionsAnsweredUnique" header="Answered (Unique)" sortable className="text-center font-semibold text-primary"></Column>
                        <Column field="totalAttempts" header="Total Attempts" sortable className="text-center"></Column>
                        <Column field="coverage" header="Coverage" body={coverageBodyTemplate} sortable></Column>
                        <Column body={actionBodyTemplate} style={{ width: '4rem' }}></Column>
                    </DataTable>
                </Card>
            </div>
        </div>
    )
}
