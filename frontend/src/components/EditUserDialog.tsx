import { useState } from 'react';
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
import { AppRole } from '@/types';

const userSchema = z.object({
    username: z.string().min(1, 'Username is required').max(50, 'Username must be less than 50 characters'),
    role: z.enum(['admin', 'member']),
    password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
});

type UserFormData = z.infer<typeof userSchema>;

interface EditUserDialogProps {
    userId: string;
    username: string;
    role: AppRole;
}

export function EditUserDialog({ userId, username, role }: EditUserDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { updateUser } = useUsers();

    const form = useForm<UserFormData>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            username,
            role,
            password: '',
        },
    });

    const onSubmit = async (data: UserFormData) => {
        setIsSubmitting(true);

        const updateData: { username?: string; role?: AppRole; password?: string } = {};

        if (data.username !== username) {
            updateData.username = data.username;
        }

        if (data.role !== role) {
            updateData.role = data.role;
        }

        if (data.password && data.password.length >= 6) {
            updateData.password = data.password;
        }

        const { error } = await updateUser(userId, updateData);

        setIsSubmitting(false);

        if (!error) {
            form.reset();
            setOpen(false);
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
                    <DialogTitle className="text-xl font-semibold">Edit User</DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        Make changes to the user account here. Click update when you're done.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Username</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter username..."
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
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Role</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="focus:ring-primary">
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="admin">Admin</SelectItem>
                                            <SelectItem value="member">Member</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Password (optional)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="Leave blank to keep current"
                                            {...field}
                                            className="focus-visible:ring-primary"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

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
                                    'Update User'
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
