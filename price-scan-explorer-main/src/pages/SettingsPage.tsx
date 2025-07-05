import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { SectionHeader } from "@/components/section-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Bell, Loader2, Moon, Sun, UserCircle, Monitor, Palette, Globe, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

export default function SettingsPage() {
  const { user, profile, updateProfile, loading } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [updating, setUpdating] = useState(false);
  const [userSettings, setUserSettings] = useState({
    email_notifications: true,
    price_alerts: true,
    marketing_emails: false,
    firstName: "",
    lastName: "",
    email: "",
    language: "en",
    currency: "USD",
    timezone: "UTC",
  });
  
  useEffect(() => {
    if (user && profile) {
      setUserSettings({
        email_notifications: profile.email_notifications ?? true,
        price_alerts: profile.price_alerts ?? true,
        marketing_emails: profile.marketing_emails ?? false,
        firstName: profile.full_name ? profile.full_name.split(' ')[0] : "",
        lastName: profile.full_name ? profile.full_name.split(' ').slice(1).join(' ') : "",
        email: user.email || "",
        language: profile.language || "en",
        currency: profile.currency || "USD",
        timezone: profile.timezone || "UTC",
      });
    }
  }, [user, profile]);
  
  const handleToggleChange = async (field: string, value: boolean) => {
    setUserSettings(prev => ({ ...prev, [field]: value }));
    
    try {
      const { error } = await updateProfile({ [field]: value });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Settings updated",
        description: "Your preferences have been saved",
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
      
      setUserSettings(prev => ({ ...prev, [field]: !value }));
    }
  };

  const handleSelectChange = async (field: string, value: string) => {
    setUserSettings(prev => ({ ...prev, [field]: value }));
    
    try {
      const { error } = await updateProfile({ [field]: value });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Settings updated",
        description: "Your preferences have been saved",
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    }
  };
  
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    
    try {
      const fullName = `${userSettings.firstName} ${userSettings.lastName}`.trim();
      
      const { error } = await updateProfile({ 
        full_name: fullName,
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'dark':
        return <Moon className="h-4 w-4" />;
      case 'light':
        return <Sun className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };
  
  // Show loading only when auth is still loading
  if (loading) {
    return (
      <MainLayout>
        <div className="container py-12 flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="container py-12">
        <SectionHeader
          title="Settings"
          description="Customize your PriceScan experience"
        />
        
        {!user && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <Card>
              <CardHeader>
                <CardTitle>Sign in for full access</CardTitle>
                <CardDescription>
                  Some settings require an account. Sign in to access account settings, notifications, and data management.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button onClick={() => navigate("/auth")}>
                  Sign In
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Tabs defaultValue="appearance" className="w-full">
            <TabsList className="grid w-full max-w-2xl grid-cols-5 mb-8">
              {user && <TabsTrigger value="account">Account</TabsTrigger>}
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              {user && <TabsTrigger value="notifications">Notifications</TabsTrigger>}
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              {user && <TabsTrigger value="privacy">Privacy</TabsTrigger>}
            </TabsList>
            
            {/* Account tab - only show when user is authenticated */}
            {user && (
              <TabsContent value="account">
                {/* ... keep existing code (account tab content) */}
                <Card>
                  <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                    <CardDescription>
                      Update your account details and personal information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-center mb-4">
                      <div className="relative">
                        <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center">
                          <UserCircle className="h-16 w-16 text-muted-foreground" />
                        </div>
                        <Button size="sm" className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0">
                          +
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First name</Label>
                          <Input 
                            id="firstName" 
                            placeholder="John" 
                            value={userSettings.firstName}
                            onChange={(e) => setUserSettings({...userSettings, firstName: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last name</Label>
                          <Input 
                            id="lastName" 
                            placeholder="Doe" 
                            value={userSettings.lastName}
                            onChange={(e) => setUserSettings({...userSettings, lastName: e.target.value})}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          value={userSettings.email}
                          disabled
                          className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">
                          Email can only be changed through the authentication settings
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button onClick={handleProfileUpdate} disabled={updating}>
                      {updating ? "Saving..." : "Save Changes"}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            )}

            {/* Appearance tab - always accessible */}
            <TabsContent value="appearance">
              {/* ... keep existing code (appearance tab content) */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Appearance
                  </CardTitle>
                  <CardDescription>
                    Customize how PriceScan looks and feels
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Theme</Label>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getThemeIcon()}
                          <span className="font-medium">
                            {theme === 'system' ? 'System' : theme === 'dark' ? 'Dark' : 'Light'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {theme === 'system' 
                            ? 'Automatically switch between light and dark based on system preference'
                            : theme === 'dark'
                            ? 'Dark mode for reduced eye strain in low light'
                            : 'Light mode for better visibility in bright environments'
                          }
                        </p>
                      </div>
                      <Select value={theme} onValueChange={setTheme}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">
                            <div className="flex items-center gap-2">
                              <Sun className="h-4 w-4" />
                              Light
                            </div>
                          </SelectItem>
                          <SelectItem value="dark">
                            <div className="flex items-center gap-2">
                              <Moon className="h-4 w-4" />
                              Dark
                            </div>
                          </SelectItem>
                          <SelectItem value="system">
                            <div className="flex items-center gap-2">
                              <Monitor className="h-4 w-4" />
                              System
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label className="text-base font-medium">Display Density</Label>
                    <Select defaultValue="comfortable">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compact">Compact</SelectItem>
                        <SelectItem value="comfortable">Comfortable</SelectItem>
                        <SelectItem value="spacious">Spacious</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Adjust spacing and sizing for your preference
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Notifications tab - only show when user is authenticated */}
            {user && (
              <TabsContent value="notifications">
                {/* ... keep existing code (notifications tab content) */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Notification Settings
                    </CardTitle>
                    <CardDescription>
                      Configure how you receive notifications and alerts
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="email_notifications" className="font-medium">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive important updates and notifications via email
                        </p>
                      </div>
                      <Switch
                        id="email_notifications"
                        checked={userSettings.email_notifications}
                        onCheckedChange={(checked) => handleToggleChange('email_notifications', checked)}
                      />
                    </div>

                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="price_alerts" className="font-medium">Price Drop Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when prices drop for your saved products
                        </p>
                      </div>
                      <Switch
                        id="price_alerts"
                        checked={userSettings.price_alerts}
                        onCheckedChange={(checked) => handleToggleChange('price_alerts', checked)}
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="marketing_emails" className="font-medium">Marketing Emails</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive promotional content and product recommendations
                        </p>
                      </div>
                      <Switch
                        id="marketing_emails"
                        checked={userSettings.marketing_emails}
                        onCheckedChange={(checked) => handleToggleChange('marketing_emails', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Preferences tab - always accessible */}
            <TabsContent value="preferences">
              {/* ... keep existing code (preferences tab content) */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Preferences
                  </CardTitle>
                  <CardDescription>
                    Set your regional and display preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select
                        value={userSettings.language}
                        onValueChange={(value) => user ? handleSelectChange('language', value) : setUserSettings(prev => ({ ...prev, language: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                          <SelectItem value="fr">Français</SelectItem>
                          <SelectItem value="de">Deutsch</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select
                        value={userSettings.currency}
                        onValueChange={(value) => user ? handleSelectChange('currency', value) : setUserSettings(prev => ({ ...prev, currency: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                          <SelectItem value="CAD">CAD (C$)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select
                        value={userSettings.timezone}
                        onValueChange={(value) => user ? handleSelectChange('timezone', value) : setUserSettings(prev => ({ ...prev, timezone: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                          <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                          <SelectItem value="Europe/London">London (GMT)</SelectItem>
                          <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {!user && (
                    <p className="text-sm text-muted-foreground">
                      Sign in to save your preferences permanently.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Privacy tab - only show when user is authenticated */}
            {user && (
              <TabsContent value="privacy">
                {/* ... keep existing code (privacy tab content) */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Privacy & Security
                    </CardTitle>
                    <CardDescription>
                      Manage your privacy settings and data preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="font-medium">Analytics & Usage Data</Label>
                          <p className="text-sm text-muted-foreground">
                            Help improve our service by sharing anonymous usage data
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="font-medium">Personalized Recommendations</Label>
                          <p className="text-sm text-muted-foreground">
                            Use your browsing history to suggest relevant products
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <Label className="font-medium">Data Management</Label>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            Download My Data
                          </Button>
                          <Button variant="outline" size="sm">
                            Delete Account
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Export your data or permanently delete your account
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </motion.div>
      </div>
    </MainLayout>
  );
}
