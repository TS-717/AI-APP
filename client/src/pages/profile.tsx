import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { User, Save, Mail, CreditCard, Building, LogOut } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { isUnauthorizedError } from "@/lib/authUtils";

const profileFormSchema = insertUserSchema.extend({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
  pan: z.string().length(10, "PAN must be 10 characters").optional().or(z.literal("")),
  gstin: z.string().length(15, "GSTIN must be 15 characters").optional().or(z.literal("")),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

export default function Profile() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      pan: "",
      gstin: "",
      profession: "",
    },
  });

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Load user data into form
  useEffect(() => {
    if (user && typeof user === 'object') {
      form.reset({
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        email: user?.email || "",
        pan: user?.pan || "",
        gstin: user?.gstin || "",
        profession: user?.profession || "",
      });
    }
  }, [user, form]);

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/profile"],
    enabled: isAuthenticated,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to update profile');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const professions = [
    "Web Developer",
    "Mobile App Developer",
    "UI/UX Designer",
    "Graphic Designer",
    "Content Writer",
    "Digital Marketer",
    "SEO Specialist",
    "Consultant",
    "Business Analyst",
    "Data Analyst",
    "Photographer",
    "Video Editor",
    "Translator",
    "Virtual Assistant",
    "Other"
  ];

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 lg:pl-64">
        <Header />
        
        <main className="p-6 space-y-6">
          {/* Profile Header */}
          <Card className="bg-card border border-border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground text-xl font-bold" data-testid="text-profile-initials">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
                      : user?.email?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground" data-testid="text-profile-name">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : user?.email || "User"}
                  </h2>
                  <p className="text-sm text-muted-foreground" data-testid="text-profile-email">
                    {user?.email}
                  </p>
                  {user?.profession && (
                    <p className="text-sm text-muted-foreground" data-testid="text-profile-profession">
                      {user.profession}
                    </p>
                  )}
                </div>
                <div className="ml-auto">
                  <Button variant="outline" onClick={handleLogout} data-testid="button-logout">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card className="bg-card border border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter first name" 
                                {...field} 
                                disabled={true}
                                data-testid="input-first-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter last name" 
                                {...field} 
                                disabled={true}
                                data-testid="input-last-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            <Mail className="h-4 w-4 mr-2" />
                            Email
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter email" 
                              {...field} 
                              disabled={true}
                              data-testid="input-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="profession"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            <Building className="h-4 w-4 mr-2" />
                            Profession
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-profession">
                                <SelectValue placeholder="Select your profession" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {professions.map((profession) => (
                                <SelectItem key={profession} value={profession}>
                                  {profession}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                      data-testid="button-save-personal-info"
                    >
                      {updateProfileMutation.isPending ? (
                        'Saving...'
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Tax Information */}
            <Card className="bg-card border border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Tax Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="pan" className="text-sm font-medium">PAN Number</Label>
                    <Input
                      id="pan"
                      placeholder="ABCDE1234F"
                      {...form.register("pan")}
                      className="mt-1 uppercase"
                      maxLength={10}
                      data-testid="input-pan"
                    />
                    {form.formState.errors.pan && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.pan.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter your 10-digit PAN number
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="gstin" className="text-sm font-medium">GSTIN (Optional)</Label>
                    <Input
                      id="gstin"
                      placeholder="12ABCDE1234F1Z5"
                      {...form.register("gstin")}
                      className="mt-1 uppercase"
                      maxLength={15}
                      data-testid="input-gstin"
                    />
                    {form.formState.errors.gstin && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.gstin.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter if you have GST registration
                    </p>
                  </div>

                  <Button 
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
                    data-testid="button-save-tax-info"
                  >
                    {updateProfileMutation.isPending ? (
                      'Saving...'
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Tax Info
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Account Statistics */}
          <Card className="bg-card border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">Account Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center" data-testid="stat-member-since">
                  <p className="text-2xl font-bold text-primary">
                    {user?.createdAt ? new Date(user.createdAt).getFullYear() : new Date().getFullYear()}
                  </p>
                  <p className="text-sm text-muted-foreground">Member Since</p>
                </div>
                <div className="text-center" data-testid="stat-profile-completion">
                  <p className="text-2xl font-bold text-secondary">
                    {user?.pan && user?.profession ? "100%" : user?.profession ? "75%" : "50%"}
                  </p>
                  <p className="text-sm text-muted-foreground">Profile Complete</p>
                </div>
                <div className="text-center" data-testid="stat-last-login">
                  <p className="text-2xl font-bold text-accent">Today</p>
                  <p className="text-sm text-muted-foreground">Last Login</p>
                </div>
                <div className="text-center" data-testid="stat-tax-year">
                  <p className="text-2xl font-bold text-foreground">2024-25</p>
                  <p className="text-sm text-muted-foreground">Current FY</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
