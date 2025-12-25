import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, Clock, CheckCircle2, BookOpen, TrendingUp, Calendar, Award } from 'lucide-react';

interface LearningStats {
  totalPracticeTime: number;
  totalCompletedSentences: number;
  totalWords: number;
  masteredWords: number;
  videosWatched: number;
  recentActivity: Array<{
    date: string;
    practiceTime: number;
    completedSentences: number;
  }>;
}

const Statistics = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    try {
      // 获取学习进度数据
      const { data: progressData } = await supabase
        .from('learning_progress')
        .select('*')
        .eq('user_id', user.id);

      // 获取单词本数据
      const { data: wordData } = await supabase
        .from('word_book')
        .select('*')
        .eq('user_id', user.id);

      // 计算统计数据
      const totalPracticeTime = progressData?.reduce((sum, p) => sum + (p.total_practice_time || 0), 0) || 0;
      const totalCompletedSentences = progressData?.reduce((sum, p) => sum + (p.completed_sentences?.length || 0), 0) || 0;
      const videosWatched = progressData?.length || 0;
      const totalWords = wordData?.length || 0;
      const masteredWords = wordData?.filter(w => w.mastery_level >= 3).length || 0;

      // 生成最近7天活动数据（基于现有数据模拟）
      const recentActivity = generateRecentActivity(progressData || []);

      setStats({
        totalPracticeTime,
        totalCompletedSentences,
        totalWords,
        masteredWords,
        videosWatched,
        recentActivity,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateRecentActivity = (progressData: any[]) => {
    const activity = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // 检查是否有该日期的更新记录
      const dayProgress = progressData.filter(p => {
        const updateDate = new Date(p.updated_at).toISOString().split('T')[0];
        return updateDate === dateStr;
      });
      
      activity.push({
        date: dateStr,
        practiceTime: dayProgress.reduce((sum, p) => sum + (p.total_practice_time || 0), 0),
        completedSentences: dayProgress.reduce((sum, p) => sum + (p.completed_sentences?.length || 0), 0),
      });
    }
    
    return activity;
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    }
    return `${minutes}分钟`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg dark:gradient-bg-dark flex items-center justify-center">
        <div className="glass p-8 rounded-2xl">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const masteryProgress = stats?.totalWords ? (stats.masteredWords / stats.totalWords) * 100 : 0;

  return (
    <>
      <Helmet>
        <title>学习统计 - AI English Club</title>
        <meta name="description" content="查看您的英语学习进度和统计数据" />
      </Helmet>
      
      <div className="min-h-screen gradient-bg dark:gradient-bg-dark flex flex-col">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold mb-6">学习统计 Statistics</h1>
          
          {/* 概览卡片 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="glass border-border/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  总学习时长
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {formatTime(stats?.totalPracticeTime || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Total Practice Time</p>
              </CardContent>
            </Card>

            <Card className="glass border-border/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  完成句数
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {stats?.totalCompletedSentences || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Completed Sentences</p>
              </CardContent>
            </Card>

            <Card className="glass border-border/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  词汇量
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {stats?.totalWords || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Words in Book</p>
              </CardContent>
            </Card>

            <Card className="glass border-border/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  学习视频
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {stats?.videosWatched || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Videos Studied</p>
              </CardContent>
            </Card>
          </div>

          {/* 详细统计 */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* 单词掌握度 */}
            <Card className="glass border-border/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  单词掌握度 Mastery
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>已掌握 Mastered</span>
                      <span className="font-medium">{stats?.masteredWords || 0} / {stats?.totalWords || 0}</span>
                    </div>
                    <Progress value={masteryProgress} className="h-3" />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/30">
                    <div className="text-center">
                      <div className="text-lg font-bold text-primary">{stats?.masteredWords || 0}</div>
                      <div className="text-xs text-muted-foreground">掌握</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-accent">{(stats?.totalWords || 0) - (stats?.masteredWords || 0)}</div>
                      <div className="text-xs text-muted-foreground">学习中</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{Math.round(masteryProgress)}%</div>
                      <div className="text-xs text-muted-foreground">掌握率</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 近7天学习活动 */}
            <Card className="glass border-border/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  近7天活动 Weekly Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.recentActivity.map((day, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-12 text-xs text-muted-foreground">
                        {formatDate(day.date)}
                      </div>
                      <div className="flex-1">
                        <div 
                          className="h-6 bg-primary/20 rounded-md flex items-center"
                          style={{ 
                            width: `${Math.min(100, (day.practiceTime / 1800) * 100)}%`,
                            minWidth: day.practiceTime > 0 ? '20px' : '4px'
                          }}
                        >
                          {day.practiceTime > 0 && (
                            <span className="text-xs px-2 text-primary font-medium">
                              {Math.floor(day.practiceTime / 60)}分
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="w-16 text-right text-xs text-muted-foreground">
                        {day.completedSentences} 句
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between text-xs text-muted-foreground mt-4 pt-4 border-t border-border/30">
                  <span>日期</span>
                  <span>学习时长</span>
                  <span>完成句数</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 学习建议 */}
          <Card className="glass border-border/30 mt-6">
            <CardHeader>
              <CardTitle>学习建议 Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                  <h4 className="font-medium mb-1">🎯 保持连续性</h4>
                  <p className="text-sm text-muted-foreground">每天学习15-30分钟，比偶尔长时间学习更有效</p>
                </div>
                <div className="p-4 bg-accent/5 rounded-xl border border-accent/20">
                  <h4 className="font-medium mb-1">🔄 复习单词</h4>
                  <p className="text-sm text-muted-foreground">定期复习单词本中的词汇，提高掌握率</p>
                </div>
                <div className="p-4 bg-secondary/5 rounded-xl border border-secondary/20">
                  <h4 className="font-medium mb-1">🎤 多练跟读</h4>
                  <p className="text-sm text-muted-foreground">跟读练习能有效提升口语和听力水平</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
};

export default Statistics;