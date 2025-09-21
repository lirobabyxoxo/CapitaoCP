import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function BotDashboard() {
  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-primary">GURIZES Discord Bot</h1>
          <p className="text-muted-foreground text-lg">
            A comprehensive Discord bot with admin commands, roleplay features, and utility functions
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Admin Commands */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🛡️ Admin Commands
                <Badge variant="destructive">Staff Only</Badge>
              </CardTitle>
              <CardDescription>
                Powerful moderation tools for server management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-1">
                <code className="bg-muted px-2 py-1 rounded text-sm">/vaza</code>
                <p className="text-sm text-muted-foreground">Ban users from the server</p>
              </div>
              <div className="space-y-1">
                <code className="bg-muted px-2 py-1 rounded text-sm">/kick</code>
                <p className="text-sm text-muted-foreground">Kick users from the server</p>
              </div>
              <div className="space-y-1">
                <code className="bg-muted px-2 py-1 rounded text-sm">/mute [time]</code>
                <p className="text-sm text-muted-foreground">Mute users (1s to 28d)</p>
              </div>
              <div className="space-y-1">
                <code className="bg-muted px-2 py-1 rounded text-sm">/unmute</code>
                <p className="text-sm text-muted-foreground">Remove user mutes</p>
              </div>
              <div className="space-y-1">
                <code className="bg-muted px-2 py-1 rounded text-sm">/unban</code>
                <p className="text-sm text-muted-foreground">Unban users by ID</p>
              </div>
            </CardContent>
          </Card>

          {/* Roleplay Commands */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                💕 Roleplay Commands
                <Badge variant="secondary">Fun</Badge>
              </CardTitle>
              <CardDescription>
                Interactive roleplay commands with anime GIFs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-1">
                <code className="bg-muted px-2 py-1 rounded text-sm">/kiss @user</code>
                <p className="text-sm text-muted-foreground">Kiss someone</p>
              </div>
              <div className="space-y-1">
                <code className="bg-muted px-2 py-1 rounded text-sm">/hug @user</code>
                <p className="text-sm text-muted-foreground">Give someone a hug</p>
              </div>
              <div className="space-y-1">
                <code className="bg-muted px-2 py-1 rounded text-sm">/kill @user</code>
                <p className="text-sm text-muted-foreground">Playfully kill someone</p>
              </div>
              <div className="space-y-1">
                <code className="bg-muted px-2 py-1 rounded text-sm">/pat @user</code>
                <p className="text-sm text-muted-foreground">Pat someone's head</p>
              </div>
              <div className="space-y-1">
                <code className="bg-muted px-2 py-1 rounded text-sm">/slap @user</code>
                <p className="text-sm text-muted-foreground">Slap someone</p>
              </div>
            </CardContent>
          </Card>

          {/* Utility Commands */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🔧 Utility Commands
                <Badge variant="outline">Tools</Badge>
              </CardTitle>
              <CardDescription>
                Helpful utilities for server members
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-1">
                <code className="bg-muted px-2 py-1 rounded text-sm">/av @user</code>
                <p className="text-sm text-muted-foreground">Show user avatar</p>
              </div>
              <div className="space-y-1">
                <code className="bg-muted px-2 py-1 rounded text-sm">/userinfo @user</code>
                <p className="text-sm text-muted-foreground">Detailed user information</p>
              </div>
              <div className="space-y-1">
                <code className="bg-muted px-2 py-1 rounded text-sm">/clear [amount]</code>
                <p className="text-sm text-muted-foreground">Clear messages (staff only)</p>
              </div>
            </CardContent>
          </Card>

          {/* Clear System */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🗑️ Quick Clear System
                <Badge variant="destructive">Configurable</Badge>
              </CardTitle>
              <CardDescription>
                Fast message clearing with custom permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-1">
                <code className="bg-muted px-2 py-1 rounded text-sm">.cl</code>
                <p className="text-sm text-muted-foreground">Clear 100 messages instantly</p>
              </div>
              <div className="space-y-1">
                <code className="bg-muted px-2 py-1 rounded text-sm">/setup</code>
                <p className="text-sm text-muted-foreground">Configure clear system settings</p>
              </div>
              <Separator />
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Configurable trigger message</p>
                <p>• Role-based permissions</p>
                <p>• User-specific access</p>
              </div>
            </CardContent>
          </Card>

          {/* Marriage System */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                💍 Marriage System
                <Badge variant="secondary">Social</Badge>
              </CardTitle>
              <CardDescription>
                Complete marriage system with proposals and history
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-1">
                <code className="bg-muted px-2 py-1 rounded text-sm">/marry @user</code>
                <p className="text-sm text-muted-foreground">Propose to someone</p>
              </div>
              <div className="space-y-1">
                <code className="bg-muted px-2 py-1 rounded text-sm">/marry</code>
                <p className="text-sm text-muted-foreground">Check marriage status</p>
              </div>
              <Separator />
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Accept/decline proposals</p>
                <p>• Marriage history tracking</p>
                <p>• Divorce functionality</p>
              </div>
            </CardContent>
          </Card>

          {/* Logging System */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📝 Logging System
                <Badge variant="outline">Monitoring</Badge>
              </CardTitle>
              <CardDescription>
                Comprehensive server activity logging
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm space-y-2">
                <div>
                  <strong className="text-foreground">Message Logs:</strong>
                  <p className="text-muted-foreground text-xs">Track message edits and deletions</p>
                </div>
                <div>
                  <strong className="text-foreground">Member Logs:</strong>
                  <p className="text-muted-foreground text-xs">Monitor nickname and avatar changes</p>
                </div>
                <div>
                  <strong className="text-foreground">Server Logs:</strong>
                  <p className="text-muted-foreground text-xs">Track channel/role changes and invites</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Setup Instructions */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>🚀 Setup Instructions</CardTitle>
            <CardDescription>
              How to add GURIZES bot to your Discord server
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Required Environment Variables:</h3>
                <div className="space-y-2 text-sm">
                  <code className="block bg-muted p-2 rounded">DISCORD_TOKEN=your_bot_token</code>
                  <code className="block bg-muted p-2 rounded">DISCORD_CLIENT_ID=your_client_id</code>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Required Permissions:</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>• Send Messages</p>
                  <p>• Use Slash Commands</p>
                  <p>• Manage Messages</p>
                  <p>• Ban Members</p>
                  <p>• Kick Members</p>
                  <p>• Moderate Members (for muting)</p>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                All embeds use black theme with minimal emojis
              </p>
              <p className="text-xs text-muted-foreground">
                Utility commands include footer: "created by lirolegal"
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
