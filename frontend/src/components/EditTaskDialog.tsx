import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Pencil, Loader2 } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { useTasks } from '@/hooks/useTasks';
import { Task } from '@/types';

const taskSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
    description: z.string().max(500, 'Description must be less than 500 characters').optional(),
    assigned_to: z.string().min(1, 'Please select a user'),
    priority: z.enum(['low', 'medium', 'high']),
    due_date: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface EditTaskDialogProps {
    task: Task;
    onSuccess?: () => void;
}

export function EditTaskDialog({ task, onSuccess }: EditTaskDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { users } = useUsers();
    const { updateTask } = useTasks();

    const form = useForm<TaskFormData>({
        resolver: zodResolver(taskSchema),
        defaultValues: {
            title: task.title,
            description: task.description || '',
            assigned_to: task.assigned_to,
            priority: task.priority,
            due_date: task.due_date || '',
        },
    });

    // Reset form when task changes
    useEffect(() => {
        form.reset({
            title: task.title,
            description: task.description || '',
            assigned_to: task.assigned_to,
            priority: task.priority,
            due_date: task.due_date || '',
        });
    }, [task, form]);

    const onSubmit = async (data: TaskFormData) => {
        setIsSubmitting(true);
        const { error } = await updateTask(task.id, {
            title: data.title,
            description: data.description,
            assigned_to: data.assigned_to,
            priority: data.priority,
            due_date: data.due_date,
        });

        setIsSubmitting(false);

        if (!error) {
            setOpen(false);
            onSuccess?.();
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Pencil className="w-4 h-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">Edit Task</DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        Make changes to the task details below.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter task title..."
                                            {...field}
                                            className="focus-visible:ring-primary"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description (optional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Enter task description..."
                                            rows={3}
                                            {...field}
                                            className="focus-visible:ring-primary resize-none"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="assigned_to"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Assign To</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="focus:ring-primary">
                                                <SelectValue placeholder="Select a user" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {users.map(user => (
                                                <SelectItem key={user.user_id} value={user.user_id}>
                                                    {user.username} {user.role === 'admin' && '(Admin)'}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="priority"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Priority</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="focus:ring-primary">
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="low">Low</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="high">High</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="due_date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Due Date</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="date"
                                                {...field}
                                                className="focus-visible:ring-primary"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="gradient-primary text-primary-foreground border-0 hover:opacity-90"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    'Update Task'
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
