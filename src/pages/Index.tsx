import { Link } from "react-router-dom";
import { ArrowRight, Smartphone, Store, Truck, Shield, Zap, Globe, LogIn, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/contexts/AuthContext";

const Index = () => {
  const { isAuthenticated, user, signOut } = useAuthContext();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">E</span>
              </div>
              <span className="text-xl font-bold text-foreground">Enatega</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#apps" className="text-muted-foreground hover:text-foreground transition-colors">Apps</a>
              <a href="#docs" className="text-muted-foreground hover:text-foreground transition-colors">Documentation</a>
              
              {isAuthenticated ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {user?.email}
                  </span>
                  <Button variant="outline" onClick={handleSignOut} className="gap-2">
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </Button>
                </div>
              ) : (
                <Link to="/auth">
                  <Button variant="default" className="gap-2">
                    <LogIn className="w-4 h-4" />
                    Connexion
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-6">
            <Zap className="w-4 h-4 mr-2" />
            Open Source Food Delivery Platform
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Build Your Own
            <span className="text-primary block">Food Delivery Empire</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Enatega is a fully realized and customizable multi-vendor food delivery application. 
            Set up your own order/delivery management system with our complete solution.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="gap-2">
              Start Building <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline">
              View Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Apps Section */}
      <section id="apps" className="py-20 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Complete Multi-App Ecosystem
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to run a successful food delivery business
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Smartphone, title: "Customer App", desc: "Mobile app for customers to browse, order, and track deliveries", color: "bg-blue-500" },
              { icon: Store, title: "Store App", desc: "Restaurant dashboard to manage orders, menu, and availability", color: "bg-orange-500" },
              { icon: Truck, title: "Rider App", desc: "Delivery partner app for accepting and completing deliveries", color: "bg-green-500" },
              { icon: Shield, title: "Admin Panel", desc: "Complete admin dashboard to manage the entire platform", color: "bg-purple-500" },
            ].map((app, index) => (
              <div key={index} className="bg-card rounded-xl p-6 border border-border hover:shadow-lg transition-shadow">
                <div className={`w-12 h-12 ${app.color} rounded-lg flex items-center justify-center mb-4`}>
                  <app.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{app.title}</h3>
                <p className="text-muted-foreground text-sm">{app.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Powerful Features
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built with modern technologies for scalability and performance
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "GraphQL API", desc: "Powerful and flexible API with real-time subscriptions" },
              { title: "Real-time Tracking", desc: "WebSocket-powered live order and delivery tracking" },
              { title: "Multi-vendor Support", desc: "Support for multiple restaurants with individual dashboards" },
              { title: "Payment Integration", desc: "Support for Stripe, PayPal, and Cash on Delivery" },
              { title: "Geo-location", desc: "Advanced location-based restaurant discovery and delivery zones" },
              { title: "Push Notifications", desc: "Real-time notifications for orders, deliveries, and promotions" },
            ].map((feature, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Globe className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Modern Tech Stack
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built with the latest and most reliable technologies
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6">
            {["React", "React Native", "Next.js", "Node.js", "GraphQL", "Prisma", "MongoDB", "WebSocket", "Expo", "TypeScript"].map((tech, index) => (
              <div key={index} className="px-4 py-2 bg-card rounded-full border border-border text-sm font-medium text-foreground">
                {tech}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Ready to Launch Your Food Delivery Platform?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Get started with Enatega today and build your own food delivery business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="gap-2">
              <a href="https://github.com/enatega/food-delivery-multivendor" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                View on GitHub <ArrowRight className="w-4 h-4" />
              </a>
            </Button>
            <Button size="lg" variant="outline">
              Read Documentation
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">E</span>
              </div>
              <span className="text-xl font-bold text-foreground">Enatega</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2024 Enatega. Open Source Food Delivery Platform.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
