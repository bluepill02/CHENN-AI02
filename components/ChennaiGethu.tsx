import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ChennaiIcons } from './IllustratedIcon';
import { Brain, Coffee, Sparkles, RefreshCw, CheckCircle2, XCircle, Loader2, MapPin, Plus, Briefcase, Phone, Star } from 'lucide-react';
import { toast } from 'sonner';
import { CinemaService, type CinemaPost } from '../services/CinemaService';
import { KaapiJobService, type KaapiJob } from '../services/KaapiJobService';
import { useAuth } from './auth/SupabaseAuthProvider';
import { Avatar } from './ui/avatar';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

// --- Madras Meter Data ---
const slangQuestions = [
    { word: "Gethu", options: ["Angry", "Style/Swag", "Lazy"], correct: 1 },
    { word: "Vetti", options: ["Busy", "Jobless/Free", "Smart"], correct: 1 },
    { word: "Semma", options: ["Awesome", "Bad", "Average"], correct: 0 },
    { word: "Macha", options: ["Enemy", "Stranger", "Friend/Bro"], correct: 2 },
    { word: "OC", options: ["Free of cost", "Over Clock", "Old City"], correct: 0 },
    { word: "Peter", options: ["A Name", "Speaking English", "Pizza"], correct: 1 },
    { word: "Sothu", options: ["Property", "Rice/Food", "Both"], correct: 2 },
    { word: "Alapparai", options: ["Silence", "Show off/Noise", "Sleeping"], correct: 1 },
];

// --- Auto Anna Quotes ---
const autoQuotes = [
    "Change illa pa, GPay pannunga. (No change, do GPay)",
    "Meter pota kattu padi aagadhu. (Meter won't work out)",
    "Madam, straight road dhaan, but one way.",
    "Teynampet signal is temporary, Traffic is permanent.",
    "Life is like a share auto, adjust panni poganum.",
    "Rain varudhu, extra 50 aagum. (It's raining, extra 50)",
    "Horn adikadheenga, aama porumai. (Don't honk, turtle patience)",
    "Chennai-la winter is just a myth, macha."
];

import { useLocation } from '../services/LocationService';

export function ChennaiGethu() {
    const { user } = useAuth();
    const { currentLocation } = useLocation();

    // --- State: Madras Meter ---
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [score, setScore] = useState(0);

    // --- State: Auto Anna ---
    const [quoteIndex, setQuoteIndex] = useState(0);

    // --- State: Cinema Kottai ---
    const [cinemaPosts, setCinemaPosts] = useState<CinemaPost[]>([]);
    const [loadingCinema, setLoadingCinema] = useState(false);
    const [showAddReview, setShowAddReview] = useState(false);
    const [newReview, setNewReview] = useState({
        movie_name: '',
        theater_name: '',
        rating: '5',
        review: '',
        post_type: 'review' as const
    });

    // --- State: Kaapi Jobs ---
    const [jobs, setJobs] = useState<KaapiJob[]>([]);
    const [loadingJobs, setLoadingJobs] = useState(false);
    const [showPostJob, setShowPostJob] = useState(false);
    const [newJob, setNewJob] = useState({
        job_title: '',
        description: '',
        location: '',
        salary_range: '',
        contact_info: ''
    });

    // --- Effects ---
    useEffect(() => {
        fetchCinemaPosts();
        fetchJobs();

        const subCinema = CinemaService.subscribeToUpdates(() => fetchCinemaPosts());
        const subJobs = KaapiJobService.subscribeToUpdates(() => fetchJobs());

        return () => {
            CinemaService.unsubscribe(subCinema);
            KaapiJobService.unsubscribe(subJobs);
        };
    }, [currentLocation]);

    const fetchCinemaPosts = async () => {
        setLoadingCinema(true);
        try {
            const data = await CinemaService.getPosts();
            setCinemaPosts(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingCinema(false);
        }
    };

    const fetchJobs = async () => {
        setLoadingJobs(true);
        try {
            const data = await KaapiJobService.getJobs();
            // Filter by location if available
            const filteredData = currentLocation?.area
                ? data.filter(job =>
                    job.location.toLowerCase().includes(currentLocation.area.toLowerCase()) ||
                    job.location.toLowerCase().includes('chennai')
                )
                : data;
            setJobs(filteredData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingJobs(false);
        }
    };

    // --- Handlers: Madras Meter ---
    const handleAnswer = (index: number) => {
        if (selectedOption !== null) return;
        setSelectedOption(index);
        const correct = index === slangQuestions[currentQIndex].correct;
        if (correct) {
            setScore(s => s + 10);
            toast.success("Semma! Correct Answer! 🎉");
        } else {
            toast.error("Aiyayo! Wrong Answer! 😅");
        }
    };

    const nextQuestion = () => {
        setSelectedOption(null);
        setCurrentQIndex((prev) => (prev + 1) % slangQuestions.length);
    };

    // --- Handlers: Auto Anna ---
    const nextQuote = () => {
        setQuoteIndex((prev) => (prev + 1) % autoQuotes.length);
    };

    // --- Handlers: Cinema Kottai ---
    const handlePostReview = async () => {
        if (!user) {
            toast.error("Please sign in to post reviews!");
            return;
        }
        if (!newReview.movie_name || !newReview.review) {
            toast.error("Please fill in Movie Name and Review!");
            return;
        }

        try {
            await CinemaService.createPost({
                user_id: user.id,
                movie_name: newReview.movie_name,
                theater_name: newReview.theater_name,
                rating: parseInt(newReview.rating),
                review: newReview.review,
                post_type: 'review',
                pincode: '600004', // Default for now
                area: 'Chennai'
            });
            toast.success("Review posted successfully!");
            setShowAddReview(false);
            setNewReview({ movie_name: '', theater_name: '', rating: '5', review: '', post_type: 'review' });
        } catch (error) {
            toast.error("Failed to post review");
        }
    };

    // --- Handlers: Kaapi Jobs ---
    const handlePostJob = async () => {
        if (!user) {
            toast.error("Please sign in to post a job!");
            return;
        }
        if (!newJob.job_title || !newJob.description || !newJob.contact_info) {
            toast.error("Please fill in Job Title, Description, and Contact Info!");
            return;
        }

        try {
            await KaapiJobService.createJob({
                user_id: user.id,
                job_title: newJob.job_title,
                description: newJob.description,
                location: newJob.location,
                salary_range: newJob.salary_range,
                contact_info: newJob.contact_info
            });
            toast.success("Job posted successfully!");
            setShowPostJob(false);
            setNewJob({ job_title: '', description: '', location: '', salary_range: '', contact_info: '' });
        } catch (error) {
            toast.error("Failed to post job");
        }
    };

    return (
        <div className="space-y-6 h-full flex flex-col">

            <div className="flex items-center justify-between mb-2 shrink-0">
                <h3 className="text-xl font-bold text-[#4B1E1E] flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-orange-500" />
                    Chennai Gethu
                </h3>
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                    Pride of Chennai
                </Badge>
            </div>

            <Tabs defaultValue="cinema" className="w-full flex-1 flex flex-col min-h-0">
                <TabsList className="grid w-full grid-cols-4 bg-orange-100/50 p-1 rounded-xl shrink-0">
                    <TabsTrigger value="cinema" className="data-[state=active]:bg-white data-[state=active]:text-orange-700 rounded-lg text-xs sm:text-sm">
                        🎬 Cinema
                    </TabsTrigger>
                    <TabsTrigger value="meter" className="data-[state=active]:bg-white data-[state=active]:text-orange-700 rounded-lg text-xs sm:text-sm">
                        🧠 Quiz
                    </TabsTrigger>
                    <TabsTrigger value="auto" className="data-[state=active]:bg-white data-[state=active]:text-orange-700 rounded-lg text-xs sm:text-sm">
                        🛺 Auto
                    </TabsTrigger>
                    <TabsTrigger value="kaapi" className="data-[state=active]:bg-white data-[state=active]:text-orange-700 rounded-lg text-xs sm:text-sm">
                        ☕ Jobs
                    </TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-y-auto min-h-0 mt-4 pr-1 scrollbar-thin scrollbar-thumb-orange-200 scrollbar-track-transparent">
                    {/* --- Cinema Kottai --- */}
                    <TabsContent value="cinema" className="space-y-4 m-0">
                        <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-black shadow-[4px_4px_0px_0px_rgba(147,51,234,1)] relative overflow-hidden">
                            <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-multiply" style={{ backgroundImage: 'url("/assets/noise.png")', backgroundRepeat: 'repeat' }}></div>
                            <div className="relative z-10 flex justify-between items-center mb-4">
                                <div>
                                    <h3 className="font-bold text-purple-900">Cinema Kottai</h3>
                                    <p className="text-xs text-purple-600">Latest reviews & updates</p>
                                </div>
                                <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={() => setShowAddReview(!showAddReview)}>
                                    <Plus className="w-4 h-4 mr-1" /> Post Review
                                </Button>
                            </div>

                            {showAddReview && (
                                <Card className="p-4 mb-4 bg-white border-purple-100 animate-in slide-in-from-top-2">
                                    <div className="space-y-3">
                                        <Input
                                            placeholder="Movie Name (e.g. Leo)"
                                            value={newReview.movie_name}
                                            onChange={(e) => setNewReview({ ...newReview, movie_name: e.target.value })}
                                        />
                                        <Input
                                            placeholder="Theater (e.g. Sathyam)"
                                            value={newReview.theater_name}
                                            onChange={(e) => setNewReview({ ...newReview, theater_name: e.target.value })}
                                        />
                                        <Select
                                            value={newReview.rating}
                                            onValueChange={(v) => setNewReview({ ...newReview, rating: v })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Rating" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="5">⭐⭐⭐⭐⭐ (Semma)</SelectItem>
                                                <SelectItem value="4">⭐⭐⭐⭐ (Nalla iruku)</SelectItem>
                                                <SelectItem value="3">⭐⭐⭐ (Ok)</SelectItem>
                                                <SelectItem value="2">⭐⭐ (Mokka)</SelectItem>
                                                <SelectItem value="1">⭐ (Kuppai)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Textarea
                                            placeholder="Your review..."
                                            value={newReview.review}
                                            onChange={(e) => setNewReview({ ...newReview, review: e.target.value })}
                                        />
                                        <Button className="w-full bg-purple-600" onClick={handlePostReview}>
                                            Post Review
                                        </Button>
                                    </div>
                                </Card>
                            )}

                            <div className="space-y-3">
                                {loadingCinema ? (
                                    <div className="flex justify-center p-4"><Loader2 className="animate-spin text-purple-500" /></div>
                                ) : cinemaPosts.length === 0 ? (
                                    <div className="text-center text-gray-500 py-8">No reviews yet. Be the first!</div>
                                ) : (
                                    cinemaPosts.map((post) => (
                                        <Card key={post.id} className="p-3 bg-white border-2 border-purple-100 hover:border-black shadow-sm hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-bold text-gray-900">{post.movie_name}</h4>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-[10px]">
                                                            {post.theater_name || 'Chennai'}
                                                        </Badge>
                                                        <span>• {new Date(post.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center bg-yellow-100 px-2 py-1 rounded text-xs font-bold text-yellow-700">
                                                    <Star className="w-3 h-3 mr-1 fill-yellow-500 text-yellow-500" />
                                                    {post.rating}/5
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-700 mt-2">{post.review}</p>
                                            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-50">
                                                <Avatar className="w-5 h-5">
                                                    <div className="w-full h-full bg-purple-200 flex items-center justify-center text-[10px] font-bold text-purple-700">
                                                        {post.profiles?.full_name?.[0]?.toUpperCase() || 'U'}
                                                    </div>
                                                </Avatar>
                                                <span className="text-xs text-gray-500">{post.profiles?.full_name || 'Anonymous'}</span>
                                            </div>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </Card>
                    </TabsContent>

                    {/* --- Madras Meter --- */}
                    <TabsContent value="meter" className="space-y-4 m-0">
                        <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50 border-2 border-black shadow-[4px_4px_0px_0px_rgba(234,88,12,1)] text-center relative overflow-hidden">
                            <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-multiply" style={{ backgroundImage: 'url("/assets/noise.png")', backgroundRepeat: 'repeat' }}></div>
                            <div className="relative z-10 mb-6">
                                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Brain className="w-8 h-8 text-orange-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Madras Meter Quiz</h3>
                                <div className="flex justify-center gap-2 mt-2">
                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                        Score: {score}
                                    </Badge>
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                        Q: {currentQIndex + 1}/{slangQuestions.length}
                                    </Badge>
                                </div>
                            </div>

                            <div className="mb-6">
                                <p className="text-sm text-gray-500 mb-2">What is the meaning of:</p>
                                <h2 className="text-3xl font-black text-orange-600 mb-6">"{slangQuestions[currentQIndex].word}"</h2>

                                <div className="grid gap-3">
                                    {slangQuestions[currentQIndex].options.map((option, idx) => (
                                        <Button
                                            key={idx}
                                            variant={selectedOption === idx ? (idx === slangQuestions[currentQIndex].correct ? "default" : "destructive") : "outline"}
                                            className={`w-full justify-start h-auto py-3 px-4 ${selectedOption === idx && idx === slangQuestions[currentQIndex].correct ? 'bg-green-600 hover:bg-green-700' : ''}`}
                                            onClick={() => handleAnswer(idx)}
                                            disabled={selectedOption !== null}
                                        >
                                            <span className="mr-3 flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center text-xs">
                                                {String.fromCharCode(65 + idx)}
                                            </span>
                                            {option}
                                            {selectedOption === idx && (
                                                <span className="ml-auto">
                                                    {idx === slangQuestions[currentQIndex].correct ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                                </span>
                                            )}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {selectedOption !== null && (
                                <div className="animate-in fade-in zoom-in duration-300">
                                    <Button onClick={nextQuestion} className="w-full bg-orange-600 hover:bg-orange-700">
                                        Next Question <RefreshCw className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            )}
                        </Card>
                    </TabsContent>

                    {/* --- Auto Anna --- */}
                    <TabsContent value="auto" className="space-y-4 m-0">
                        <Card className="p-6 bg-[#FFFBE6] border-2 border-black shadow-[4px_4px_0px_0px_rgba(250,204,21,1)] relative overflow-hidden">
                            <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-multiply" style={{ backgroundImage: 'url("/assets/noise.png")', backgroundRepeat: 'repeat' }}></div>
                            {/* Decorative Background */}
                            <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
                                <img src={ChennaiIcons.mascot_auto} alt="Auto" className="w-32 h-32 object-contain" />
                            </div>

                            <div className="relative z-10 text-center">
                                <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-black">
                                    <span className="text-4xl">🛺</span>
                                </div>
                                <h3 className="text-xl font-black text-black mb-1">AUTO ANNA SAYS...</h3>
                                <div className="h-1 w-20 bg-black mx-auto mb-6"></div>

                                <blockquote className="text-lg font-medium text-gray-800 italic mb-6 min-h-[80px] flex items-center justify-center">
                                    "{autoQuotes[quoteIndex]}"
                                </blockquote>

                                <Button
                                    onClick={nextQuote}
                                    className="bg-black text-yellow-400 hover:bg-gray-900 border-2 border-yellow-400 font-bold"
                                >
                                    Innoru Quote Sollunga <RefreshCw className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </Card>
                    </TabsContent>

                    {/* --- Kaapi Jobs --- */}
                    <TabsContent value="kaapi" className="space-y-4 m-0">
                        {/* Kaapi & Careers Card */}
                        <Card className="p-6 bg-[#FFF8F0] border-2 border-black shadow-[4px_4px_0px_0px_rgba(217,119,6,1)] relative overflow-hidden">
                            <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-multiply" style={{ backgroundImage: 'url("/assets/noise.png")', backgroundRepeat: 'repeat' }}></div>
                            <div className="absolute top-4 right-4 opacity-10">
                                <Coffee className="w-12 h-12 text-orange-900" />
                            </div>

                            <div className="relative z-10">
                                <h3 className="text-xl font-bold text-black flex items-center gap-3 mb-4">
                                    <Coffee className="w-6 h-6 text-black" /> Kaapi & Careers
                                </h3>

                                <blockquote className="text-gray-800 italic mb-4 leading-relaxed font-medium">
                                    "No job is small, no effort is wasted. Every role builds our Chennai. Whether you serve kaapi or write code, your work has dignity and value."
                                </blockquote>

                                <p className="text-gray-600 text-sm">
                                    Find part-time gigs, local help, or quick tasks here. Connect over a virtual kaapi!
                                </p>
                            </div>
                        </Card>

                        {/* Hiring Action Card */}
                        <Card
                            className="p-4 bg-white border-2 border-black shadow-sm hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer group"
                            onClick={() => setShowPostJob(!showPostJob)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-white border-2 border-orange-900 rounded-lg">
                                        <Briefcase className="w-5 h-5 text-orange-900" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">Hiring? Need Help?</h3>
                                        <p className="text-gray-500 text-sm">Post a job for the community</p>
                                    </div>
                                </div>
                                <div className="text-orange-500 group-hover:scale-110 transition-transform">
                                    <Plus className="w-6 h-6" />
                                </div>
                            </div>
                        </Card>

                        {showPostJob && (
                            <Card className="p-4 mb-4 bg-white border-amber-100 animate-in slide-in-from-top-2">
                                <div className="space-y-3">
                                    <Input
                                        placeholder="Job Title (e.g. Sales Executive)"
                                        value={newJob.job_title}
                                        onChange={(e) => setNewJob({ ...newJob, job_title: e.target.value })}
                                    />
                                    <Input
                                        placeholder="Contact Info (Phone/Email)"
                                        value={newJob.contact_info}
                                        onChange={(e) => setNewJob({ ...newJob, contact_info: e.target.value })}
                                    />

                                    <Button className="w-full bg-amber-700 hover:bg-amber-800" onClick={handlePostJob}>
                                        Post Job
                                    </Button>
                                </div>
                            </Card>
                        )}

                        <div className="space-y-3">
                            {loadingJobs ? (
                                <div className="flex justify-center p-4"><Loader2 className="animate-spin text-amber-600" /></div>
                            ) : jobs.length === 0 ? (
                                <div className="text-center text-gray-500 py-8">No jobs available right now.</div>
                            ) : (
                                jobs.map((job) => (
                                    <Card key={job.id} className="p-3 bg-white border-2 border-amber-100 hover:border-black shadow-sm hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-gray-900">{job.job_title}</h4>
                                                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location || 'Chennai'}</span>
                                                    <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {job.salary_range || 'Negotiable'}</span>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                                                {new Date(job.created_at).toLocaleDateString()}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-gray-700 mt-2 line-clamp-2">{job.description}</p>
                                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="w-5 h-5">
                                                    <div className="w-full h-full bg-amber-200 flex items-center justify-center text-[10px] font-bold text-amber-800">
                                                        {job.profiles?.full_name?.[0]?.toUpperCase() || 'R'}
                                                    </div>
                                                </Avatar>
                                                <span className="text-xs text-gray-500">{job.profiles?.full_name || 'Recruiter'}</span>
                                            </div>
                                            <Button size="sm" variant="ghost" className="h-7 text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-50" onClick={() => toast.success(`Contact: ${job.contact_info}`)}>
                                                <Phone className="w-3 h-3 mr-1" /> Contact
                                            </Button>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
