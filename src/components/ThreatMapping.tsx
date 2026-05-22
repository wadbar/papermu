import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function ThreatMapping() {
  const d3Container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!d3Container.current) return;

    // Clear previous
    d3.select(d3Container.current).selectAll('*').remove();

    const data = [
      { id: "China", value: 420, color: "#ef4444" },
      { id: "Russia", value: 350, color: "#f97316" },
      { id: "N. Korea", value: 200, color: "#8b5cf6" },
      { id: "USA", value: 150, color: "#3b82f6" },
      { id: "Brazil", value: 90, color: "#10b981" },
      { id: "Germany", value: 60, color: "#eab308" },
      { id: "Unknown", value: 110, color: "#64748b" }
    ];

    const width = d3Container.current.clientWidth;
    const height = 300;

    const svg = d3.select(d3Container.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .attr('style', 'max-width: 100%; height: auto; font: 10px sans-serif;');

    // Pack layout
    const pack = d3.pack<any>()
      .size([width - 2, height - 2])
      .padding(3);

    const root = pack(d3.hierarchy({ children: data })
      .sum(d => d.value)
      .sort((a: any, b: any) => b.value - a.value));

    const leaf = svg.selectAll('g')
      .data(root.leaves())
      .join('g')
      .attr('transform', d => `translate(${d.x + 1},${d.y + 1})`);

    leaf.append('circle')
      .attr('id', (d, i) => (d.leafUid = `leaf-${i}`))
      .attr('r', d => d.r)
      .attr('fillOpacity', 0.7)
      .attr('fill', (d: any) => d.data.color)
      .on('mouseover', function() {
        d3.select(this).attr('fillOpacity', 1).attr('stroke', '#fff').attr('stroke-width', 2);
      })
      .on('mouseout', function() {
        d3.select(this).attr('fillOpacity', 0.7).attr('stroke', 'none');
      });

    leaf.append('clipPath')
      .attr('id', d => (d.clipUid = `clip-${d.leafUid}`))
      .append('use')
      .attr('xlink:href', d => `#${d.leafUid}`);

    leaf.append('text')
      .attr('clip-path', d => `url(#${d.clipUid})`)
      .selectAll('tspan')
      .data((d: any) => [d.data.id, d.data.value.toString()])
      .join('tspan')
      .attr('x', 0)
      .attr('y', (d, i, nodes) => `${(i === nodes.length - 1 ? 0.3 : -0.3) * 1.5 + 0.3}em`)
      .attr('fill', '#fff')
      .attr('font-weight', (d, i) => i === 0 ? 'bold' : 'normal')
      .attr('text-anchor', 'middle')
      .text(d => d);

    leaf.append('title')
      .text((d: any) => `${d.data.id}\n${d.data.value} attacks`);

    // Handle resize
    const handleResize = () => {
       if (d3Container.current) {
         svg.attr('width', d3Container.current.clientWidth);
       }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);

  }, []);

  return (
    <div className="w-full h-full relative" ref={d3Container}>
    </div>
  );
}
