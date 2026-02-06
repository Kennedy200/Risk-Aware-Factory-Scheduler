import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import styles from './Landing.module.css';

const GraphBackground = () => {
    const svgRef = useRef(null);

    useEffect(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;

        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height)
            .style('position', 'absolute')
            .style('top', 0)
            .style('left', 0)
            .style('z-index', 0)
            .style('opacity', 0.4); // Subtle background

        // Generate random nodes (Tasks) and links (Dependencies)
        const nodes = Array.from({ length: 40 }, (_, i) => ({ id: i }));
        const links = [];
        for (let i = 0; i < 30; i++) {
            links.push({
                source: Math.floor(Math.random() * 40),
                target: Math.floor(Math.random() * 40)
            });
        }

        const simulation = d3.forceSimulation(nodes)
            .force('charge', d3.forceManyBody().strength(-100))
            .force('link', d3.forceLink(links).distance(150))
            .force('center', d3.forceCenter(width / 2, height / 2));

        const link = svg.append('g')
            .selectAll('line')
            .data(links)
            .enter().append('line')
            .attr('stroke', '#3b82f6') // Cyber Blue
            .attr('stroke-width', 1)
            .attr('opacity', 0.3);

        const node = svg.append('g')
            .selectAll('circle')
            .data(nodes)
            .enter().append('circle')
            .attr('r', 4)
            .attr('fill', (d) => d.id % 2 === 0 ? '#f97316' : '#3b82f6'); // Orange/Blue

        simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            node
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);
        });

        // Add subtle movement
        const interval = setInterval(() => {
            simulation.alpha(0.1).restart();
        }, 3000);

        return () => {
            clearInterval(interval);
            simulation.stop();
        };
    }, []);

    return <svg ref={svgRef} className={styles.d3Canvas} />;
};

export default GraphBackground;