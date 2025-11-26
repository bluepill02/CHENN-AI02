import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ChennaiIcons } from './IllustratedIcon';
import { Brain, Coffee, Sparkles, Trophy, RefreshCw, CheckCircle2, XCircle, Loader2, MapPin, Plus, Briefcase, IndianRupee, Phone } from 'lucide-react';
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

export function ChennaiGethu() {
    const { user } = useAuth();

    // --- State: Madras Meter ---
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
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
    }, []);

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
            setJobs(data);
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
        setIsCorrect(correct);
        if (correct) {
            setScore(s => s + 10);
            toast.success("Semma! Correct Answer! 🎉");
        } else {
            toast.error("Aiyayo! Wrong Answer! 😅");
        }
    };

    const nextQuestion = () => {
        setSelectedOption(null);
        setIsCorrect(null);
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

                {/* --- Tab: Cinema Kottai --- */}
                <TabsContent value="cinema" className="mt-4 flex-1 overflow-y-auto min-h-0">
                    <div className="space-y-4">
                        {!showAddReview ? (
                            <Card
                                onClick={() => setShowAddReview(true)}
                                className="p-4 bg-white border-orange-200 shadow-sm cursor-pointer hover:shadow-md transition-all mb-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold">
                                        {user?.user_metadata?.full_name?.[0] || 'U'}
                                    </div>
                                    <div className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-gray-500 text-sm border border-gray-200">
                                        Write a movie review...
                                    </div>
                                    <Button size="icon" variant="ghost" className="text-orange-500">
                                        <Plus className="w-5 h-5" />
                                    </Button>
                                </div>
                            </Card>
                        ) : (
                            <Card className="p-4 bg-gray-900 border-gray-800 text-white mb-4">
                                <h3 className="font-bold mb-3 text-yellow-400">New Movie Review</h3>
                                <div className="space-y-3">
                                    <Input
                                        placeholder="Movie Name (e.g. Leo)"
                                        className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                                        value={newReview.movie_name}
                                        onChange={e => setNewReview({ ...newReview, movie_name: e.target.value })}
                                    />
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Theater (Optional)"
                                            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 flex-1"
                                            value={newReview.theater_name}
                                            onChange={e => setNewReview({ ...newReview, theater_name: e.target.value })}
                                        />
                                        <Select
                                            value={newReview.rating}
                                            onValueChange={v => setNewReview({ ...newReview, rating: v })}
                                        >
                                            <SelectTrigger className="w-[100px] bg-gray-800 border-gray-700 text-white">
                                                <SelectValue placeholder="Rating" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {[1, 2, 3, 4, 5].map(r => (
                                                    <SelectItem key={r} value={r.toString()}>{r} ⭐</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Textarea
                                        placeholder="Your review... (No spoilers!)"
                                        className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                                        value={newReview.review}
                                        onChange={e => setNewReview({ ...newReview, review: e.target.value })}
                                    />
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" onClick={() => setShowAddReview(false)} className="text-gray-400 hover:text-white">Cancel</Button>
                                        <Button onClick={handlePostReview} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">Post Review</Button>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* Reviews List */}
                        <div className="space-y-3">
                            {loadingCinema ? (
                                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>
                            ) : cinemaPosts.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">No reviews yet. Be the first!</div>
                            ) : (
                                cinemaPosts.map(post => (
                                    <Card key={post.id} className="p-4 border-l-4 border-l-yellow-400 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                                                    {post.movie_name}
                                                    <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                                                        {post.rating} ⭐
                                                    </Badge>
                                                </h4>
                                                {post.theater_name && (
                                                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                        <MapPin className="w-3 h-3" /> {post.theater_name}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {new Date(post.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <p className="text-gray-700 text-sm mb-3 italic">"{post.review}"</p>
                                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                                            <Avatar className="w-5 h-5">
                                                <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-[10px] text-white">
                                                    {post.profiles?.full_name?.[0] || 'U'}
                                                </div>
                                            </Avatar>
                                            <span className="text-xs text-gray-500">{post.profiles?.full_name || 'Anonymous'}</span>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>
                </TabsContent>

                {/* --- Tab: Madras Meter --- */}
                <TabsContent value="meter" className="mt-4 flex-1 overflow-y-auto min-h-0">
                    <Card className="p-5 bg-gradient-to-br from-white to-orange-50 border-orange-200 shadow-md">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <Brain className="w-5 h-5 text-orange-600" />
                                <span className="font-bold text-lg text-gray-800">Slang Challenge</span>
                            </div>
                            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                                Score: {score}
                            </Badge>
                        </div>

                        <div className="text-center mb-6">
                            <p className="text-sm text-gray-500 mb-1">What is the meaning of?</p>
                            <h2 className="text-3xl font-black text-orange-600 tracking-wide">
                                "{slangQuestions[currentQIndex].word}"
                            </h2>
                        </div>

                        <div className="grid gap-3">
                            {slangQuestions[currentQIndex].options.map((option, idx) => (
                                <Button
                                    key={idx}
                                    variant={
                                        selectedOption === null
                                            ? "outline"
                                            : selectedOption === idx
                                                ? isCorrect ? "default" : "destructive"
                                                : idx === slangQuestions[currentQIndex].correct
                                                    ? "default" // Show correct answer if wrong one picked
                                                    : "outline"
                                    }
                                    className={`w-full justify-start h-auto py-3 px-4 text-left transition-all ${selectedOption === null ? "hover:border-orange-400 hover:bg-orange-50" : ""
                                        } ${selectedOption !== null && idx === slangQuestions[currentQIndex].correct ? "bg-green-600 hover:bg-green-700 text-white border-green-600" : ""
                                        }`}
                                    onClick={() => handleAnswer(idx)}
                                    disabled={selectedOption !== null}
                                >
                                    <span className="flex-1">{option}</span>
                                    {selectedOption === idx && (
                                        isCorrect ? <CheckCircle2 className="w-5 h-5 ml-2" /> : <XCircle className="w-5 h-5 ml-2" />
                                    )}
                                </Button>
                            ))}
                        </div>

                        {selectedOption !== null && (
                            <div className="mt-4 flex justify-end">
                                <Button onClick={nextQuestion} size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                                    Next Word <Trophy className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        )}
                    </Card>
                </TabsContent>

                {/* --- Tab: Auto Anna --- */}
                <TabsContent value="auto" className="mt-4 flex-1 overflow-y-auto min-h-0">
                    <Card className="p-6 bg-[#FFFBE6] border-yellow-400 border-2 shadow-[4px_4px_0px_0px_rgba(250,204,21,1)] relative overflow-hidden">
                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
                            <ImageWithFallback src={ChennaiIcons.auto} alt="Auto" className="w-32 h-32 object-contain" />
                        </div>

                        <div className="relative z-10 text-center">
                            <div className="w-16 h-16 bg-yellow-400 rounded-full mx-auto mb-4 flex items-center justify-center border-4 border-black">
                                <span className="text-3xl">🛺</span>
                            </div>

                            <h3 className="font-bold text-xl mb-1 text-black">Auto Anna Says...</h3>
                            <div className="h-0.5 w-16 bg-black mx-auto mb-6"></div>

                            <div className="min-h-[80px] flex items-center justify-center mb-6">
                                <p className="text-lg font-medium text-gray-800 italic leading-relaxed">
                                    "{autoQuotes[quoteIndex]}"
                                </p>
                            </div>

                            <Button
                                onClick={nextQuote}
                                className="bg-black text-yellow-400 hover:bg-gray-800 border-2 border-transparent hover:border-yellow-400 transition-all font-bold"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Next Wisdom
                            </Button>
                        </div>
                    </Card>
                </TabsContent>

                {/* --- Tab: Kaapi Jobs --- */}
                <TabsContent value="kaapi" className="mt-4 flex-1 overflow-y-auto min-h-0">
                    <div className="space-y-6">
                        {/* Dignity of Labour Message */}
                        <Card className="p-6 bg-[#3C2A21] text-[#EFEBE9] border-none shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 opacity-10">
                                <Coffee className="w-32 h-32" />
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                                    <Coffee className="w-6 h-6 text-[#D7CCC8]" />
                                    Kaapi & Careers
                                </h3>
                                <p className="text-sm text-[#D7CCC8] italic leading-relaxed mb-4">
                                    "No job is small, no effort is wasted. Every role builds our Chennai.
                                    Whether you serve kaapi or write code, your work has dignity and value."
                                </p>
                                <div className="h-0.5 w-full bg-[#5D4037] mb-4"></div>
                                <p className="text-xs text-[#A1887F]">
                                    Find part-time gigs, local help, or quick tasks here.
                                    Connect over a virtual kaapi!
                                </p>
                            </div>
                        </Card>

                        {/* Post Job Trigger */}
                        {!showPostJob ? (
                            <Card
                                onClick={() => setShowPostJob(true)}
                                className="p-4 bg-white border-orange-200 shadow-sm cursor-pointer hover:shadow-md transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#3C2A21] flex items-center justify-center text-[#EFEBE9]">
                                        <Briefcase className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-gray-800">Hiring? Need Help?</h4>
                                        <p className="text-xs text-gray-500">Post a job for the community</p>
                                    </div>
                                    <Button size="icon" variant="ghost" className="text-orange-500">
                                        <Plus className="w-5 h-5" />
                                    </Button>
                                </div>
                            </Card>
                        ) : (
                            <Card className="p-4 bg-white border-orange-200 shadow-md">
                                <h3 className="font-bold mb-3 text-[#3C2A21]">Post a Job</h3>
                                <div className="space-y-3">
                                    <Input
                                        placeholder="Job Title (e.g. Weekend Delivery, Shop Helper)"
                                        value={newJob.job_title}
                                        onChange={e => setNewJob({ ...newJob, job_title: e.target.value })}
                                    />
                                    <Textarea
                                        placeholder="Description (What needs to be done?)"
                                        value={newJob.description}
                                        onChange={e => setNewJob({ ...newJob, description: e.target.value })}
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input
                                            placeholder="Location (e.g. T. Nagar)"
                                            value={newJob.location}
                                            onChange={e => setNewJob({ ...newJob, location: e.target.value })}
                                        />
                                        <Input
                                            placeholder="Salary (e.g. ₹500/day)"
                                            value={newJob.salary_range}
                                            onChange={e => setNewJob({ ...newJob, salary_range: e.target.value })}
                                        />
                                    </div>
                                    <Input
                                        placeholder="Contact Info (Phone/Email)"
                                        value={newJob.contact_info}
                                        onChange={e => setNewJob({ ...newJob, contact_info: e.target.value })}
                                    />
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" onClick={() => setShowPostJob(false)}>Cancel</Button>
                                        <Button onClick={handlePostJob} className="bg-[#3C2A21] hover:bg-[#5D4037] text-white">Post Job</Button>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* Jobs List */}
                        <div className="space-y-3">
                            {loadingJobs ? (
                                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[#3C2A21]" /></div>
                            ) : jobs.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">No jobs posted yet.</div>
                            ) : (
                                jobs.map(job => (
                                    <Card key={job.id} className="p-4 border-l-4 border-l-[#3C2A21] shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-bold text-lg text-gray-900">{job.job_title}</h4>
                                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                    <MapPin className="w-3 h-3" /> {job.location || 'Chennai'}
                                                    <span className="mx-1">•</span>
                                                    <Briefcase className="w-3 h-3" /> Part-Time
                                                </div>
                                            </div>
                                            <Badge variant="secondary" className="bg-[#EFEBE9] text-[#3C2A21]">
                                                {job.salary_range || 'Negotiable'}
                                            </Badge>
                                        </div>
                                        <p className="text-gray-700 text-sm mb-3">{job.description}</p>
                                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="w-5 h-5">
                                                    <div className="w-full h-full bg-[#3C2A21] rounded-full flex items-center justify-center text-[10px] text-white">
                                                        {job.profiles?.full_name?.[0] || 'U'}
                                                    </div>
                                                </Avatar>
                                                <span className="text-xs text-gray-500">{job.profiles?.full_name || 'Recruiter'}</span>
                                            </div>
                                            <Button size="sm" variant="outline" className="h-7 text-xs border-[#3C2A21] text-[#3C2A21] hover:bg-[#3C2A21] hover:text-white" onClick={() => toast.info(`Contact: ${job.contact_info}`)}>
                                                <Phone className="w-3 h-3 mr-1" /> Contact
                                            </Button>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
