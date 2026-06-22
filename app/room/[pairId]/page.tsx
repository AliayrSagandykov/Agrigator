import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Video, CalendarClock, FileText, Paperclip, Clock } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import {
  getPairForUser,
  getMaterials,
  getHomeworks,
  getProgress,
  getMessages,
  getPairLessons,
  getPairUpcoming,
} from "@/lib/pairs";
import { computeStudentProgress } from "@/lib/metrics";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/avatar";
import { RoomTabs, type RoomTab } from "@/components/room/room-tabs";
import { AddItemForm } from "@/components/room/add-item-form";
import { AddProgressForm } from "@/components/room/add-progress-form";
import { SubmitHomeworkForm, ReviewHomeworkForm } from "@/components/room/homework-actions";
import { ProgressChart } from "@/components/room/progress-chart";
import { MessageForm } from "@/components/room/message-form";
import { LessonNoteForm } from "@/components/room/lesson-note-form";
import { formatDateTime } from "@/lib/utils";
import { shortTzLabel, tzCity } from "@/lib/time";

export const metadata = { title: "Кабинет пары — Agrigator" };

const HW_BADGE: Record<string, { label: string; variant: "outline" | "secondary" | "success" }> = {
  open: { label: "ждёт сдачи", variant: "outline" },
  submitted: { label: "на проверке", variant: "secondary" },
  done: { label: "проверено", variant: "success" },
};

export default async function RoomPage({ params }: { params: { pairId: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const view = await getPairForUser(params.pairId, user.id, user.role === "admin");
  if (!view) notFound();

  const { pair, viewerRole } = view;
  const canTutor = viewerRole === "tutor" || user.role === "admin";
  const visavi = viewerRole === "tutor" ? view.student : view.tutor;
  const tz = user.timezone ?? undefined; // время уроков — в поясе зрителя
  // Подсказка о поясе собеседника, если он отличается.
  const otherTz =
    visavi.timezone && visavi.timezone !== user.timezone
      ? `${tzCity(visavi.timezone)} · ${shortTzLabel(visavi.timezone)}`
      : null;

  const [materials, homeworks, progress, messages, lessons, upcoming, studentProgress] = await Promise.all([
    getMaterials(pair.id),
    getHomeworks(pair.id),
    getProgress(pair.id),
    getMessages(pair.id),
    getPairLessons(pair.studentId, pair.tutorId),
    getPairUpcoming(pair.studentId, pair.tutorId),
    computeStudentProgress(pair.studentId),
  ]);

  const nextLesson = upcoming[0] ?? null;
  // Сколько домашек требует внимания именно этого пользователя.
  const hwBadge = canTutor
    ? homeworks.filter((h) => h.status === "submitted").length
    : homeworks.filter((h) => h.status === "open").length;

  const tabs: RoomTab[] = [
    {
      id: "schedule",
      label: "Расписание",
      content: (
        <div className="space-y-3">
          {upcoming.length === 0 && (
            <p className="text-sm text-muted-foreground">Запланированных уроков нет.</p>
          )}
          {upcoming.map((b) => (
            <Card key={b.id}>
              <CardContent className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3">
                  <CalendarClock size={18} className="text-muted-foreground" />
                  <div>
                    <div className="font-medium">{formatDateTime(b.slotAt, tz)}</div>
                    <div className="text-sm text-muted-foreground">{b.kind === "trial" ? "пробный" : "урок"}</div>
                  </div>
                </div>
                {b.acceptedAt ? (
                  <a href={b.meetLink} target="_blank" rel="noopener noreferrer">
                    <Button size="sm"><Video size={15} /> Войти</Button>
                  </a>
                ) : (
                  <Badge variant="outline">ждёт подтверждения</Badge>
                )}
              </CardContent>
            </Card>
          ))}
          {viewerRole === "student" && (
            <Link href={`/book/${pair.tutorId}`}>
              <Button variant="outline" size="sm"><CalendarClock size={15} /> Забронировать ещё</Button>
            </Link>
          )}
        </div>
      ),
    },
    {
      id: "lessons",
      label: "Уроки",
      badge: lessons.length || undefined,
      content: (
        <div className="space-y-2">
          {lessons.length === 0 && <p className="text-sm text-muted-foreground">Проведённых уроков пока нет.</p>}
          {lessons.map((l) => (
            <Card key={l.id}>
              <CardContent className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                    {l.sequenceNo}
                  </span>
                  <div>
                    <div className="text-sm text-muted-foreground">{formatDateTime(l.happenedAt, tz)}</div>
                    <LessonNoteForm lessonId={l.id} topic={l.topic} canEdit={canTutor} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ),
    },
    {
      id: "materials",
      label: "Материалы",
      badge: materials.length || undefined,
      content: (
        <div className="space-y-3">
          <AddItemForm pairId={pair.id} type="material" />
          {materials.length === 0 && <p className="text-sm text-muted-foreground">Материалов пока нет.</p>}
          {materials.map((m) => (
            <Card key={m.id}>
              <CardContent className="py-3">
                <div className="flex items-start gap-3">
                  <FileText size={18} className="mt-0.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{m.title || "Без названия"}</div>
                    {m.body && <p className="mt-0.5 whitespace-pre-wrap text-sm text-muted-foreground">{m.body}</p>}
                    {m.fileUrl && (
                      <a href={m.fileUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm text-primary hover:underline">
                        <Paperclip size={13} /> файл
                      </a>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatDateTime(m.createdAt, tz)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ),
    },
    {
      id: "homework",
      label: "Домашка",
      badge: hwBadge || undefined,
      content: (
        <div className="space-y-3">
          {canTutor && <AddItemForm pairId={pair.id} type="homework" />}
          {homeworks.length === 0 && <p className="text-sm text-muted-foreground">Домашних заданий пока нет.</p>}
          {homeworks.map((h) => {
            const badge = HW_BADGE[h.status] ?? HW_BADGE.open;
            return (
              <Card key={h.id}>
                <CardContent className="space-y-2 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium">{h.title || "Домашнее задание"}</div>
                      {h.body && <p className="mt-0.5 whitespace-pre-wrap text-sm text-muted-foreground">{h.body}</p>}
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {h.fileUrl && (
                          <a href={h.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                            <Paperclip size={13} /> файл
                          </a>
                        )}
                        {h.dueAt && (
                          <span className="inline-flex items-center gap-1"><Clock size={12} /> до {formatDateTime(h.dueAt, tz)}</span>
                        )}
                      </div>
                    </div>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </div>

                  {/* Сдача ученика */}
                  {h.submission ? (
                    <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
                      <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span>Сдано {formatDateTime(h.submission.submittedAt, tz)}</span>
                        {h.submission.fileUrl && (
                          <a href={h.submission.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                            <Paperclip size={13} /> работа
                          </a>
                        )}
                      </div>
                      {h.submission.body && <p className="whitespace-pre-wrap">{h.submission.body}</p>}
                      {h.submission.reviewState === "reviewed" ? (
                        h.submission.reviewNote && (
                          <p className="mt-2 border-t border-border pt-2 text-muted-foreground">
                            <span className="font-medium text-foreground">Комментарий: </span>{h.submission.reviewNote}
                          </p>
                        )
                      ) : (
                        canTutor && <ReviewHomeworkForm homeworkId={h.id} />
                      )}
                    </div>
                  ) : (
                    viewerRole === "student" && h.status !== "done" && <SubmitHomeworkForm homeworkId={h.id} />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ),
    },
    {
      id: "progress",
      label: "Прогресс",
      content: (
        <div className="space-y-4">
          {studentProgress.delta != null && studentProgress.latest != null && (
            <Badge variant="success">официальная дельта {studentProgress.delta > 0 ? "+" : ""}{studentProgress.delta}</Badge>
          )}
          <ProgressChart points={progress} />
          <div className="border-t border-border pt-3">
            <div className="mb-2 text-xs text-muted-foreground">Добавить балл</div>
            <AddProgressForm pairId={pair.id} />
          </div>
        </div>
      ),
    },
    {
      id: "chat",
      label: "Чат",
      content: (
        <div className="space-y-3">
          <div className="max-h-[420px] space-y-2 overflow-y-auto">
            {messages.length === 0 && <p className="text-sm text-muted-foreground">Сообщений пока нет. Напишите первое.</p>}
            {messages.map((m) => {
              const own = m.authorId === user.id;
              return (
                <div key={m.id} className={own ? "flex justify-end" : "flex justify-start"}>
                  <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm ${own ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    {!own && <div className="mb-0.5 text-xs font-medium opacity-70">{m.authorName ?? "—"}</div>}
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    <div className={`mt-0.5 text-[10px] ${own ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {new Date(m.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <MessageForm pairId={pair.id} />
        </div>
      ),
    },
  ];

  return (
    <div className="container max-w-3xl py-8">
      <Link
        href={viewerRole === "tutor" ? "/tutor" : "/dashboard"}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={15} /> В кабинет
      </Link>

      {/* Шапка пары */}
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={visavi.name} color={visavi.avatarColor} size={52} />
          <div>
            <h1 className="text-xl font-bold">{visavi.name}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {pair.subject && <Badge variant="secondary">{pair.subject}</Badge>}
              <span>{viewerRole === "tutor" ? "ваш ученик" : "ваш тьютор"}</span>
              {otherTz && <span className="text-xs">· {otherTz}</span>}
            </div>
          </div>
        </div>
        {nextLesson && (
          <Card className="sm:w-64">
            <CardContent className="flex items-center justify-between gap-2 py-3">
              <div>
                <div className="text-xs text-muted-foreground">Следующий урок</div>
                <div className="text-sm font-medium">{formatDateTime(nextLesson.slotAt, tz)}</div>
              </div>
              {nextLesson.acceptedAt && (
                <a href={nextLesson.meetLink} target="_blank" rel="noopener noreferrer">
                  <Button size="sm"><Video size={15} /></Button>
                </a>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Разделы */}
      <div className="mt-6">
        <RoomTabs tabs={tabs} />
      </div>
    </div>
  );
}
